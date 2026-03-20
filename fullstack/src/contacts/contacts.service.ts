import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactWebhookDto } from './dto/create-contact-webhook.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  private static readonly UNIQUE_VIOLATION_CODE: string = '23505';

  public constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  public async create(createContactDto: CreateContactDto): Promise<Contact> {
    await this.ensureEmailIsUnique(createContactDto.email);

    const contact: Contact = this.contactsRepository.create({
      ...createContactDto,
      source: createContactDto.source ?? 'manual',
      eventType: createContactDto.eventType ?? 'contact_created',
    });

    try {
      return await this.contactsRepository.save(contact);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Contact with email "${createContactDto.email}" already exists`,
        );
      }

      throw new InternalServerErrorException(
        'Unexpected error creating contact',
      );
    }
  }

  public async createFromWebhook(
    createContactWebhookDto: CreateContactWebhookDto,
  ): Promise<Contact> {
    return this.create({
      fullName: createContactWebhookDto.payload.fullName,
      email: createContactWebhookDto.payload.email,
      phone: createContactWebhookDto.payload.phone,
      message: createContactWebhookDto.payload.message,
      source: createContactWebhookDto.source,
      eventType: createContactWebhookDto.eventType,
    });
  }

  public async findAll(): Promise<Contact[]> {
    try {
      return await this.contactsRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch {
      throw new InternalServerErrorException(
        'Unexpected error reading contacts',
      );
    }
  }

  public async findOne(id: string): Promise<Contact> {
    let contact: Contact | null;

    try {
      contact = await this.contactsRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException(
        'Unexpected error reading contact',
      );
    }

    if (!contact) {
      throw new NotFoundException(`Contact with id "${id}" not found`);
    }

    return contact;
  }

  public async update(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const existingContact: Contact = await this.findOne(id);
    const nextEmail: string = updateContactDto.email ?? existingContact.email;

    if (nextEmail !== existingContact.email) {
      await this.ensureEmailIsUnique(nextEmail, id);
    }

    const updatedContact: Contact = this.contactsRepository.merge(
      existingContact,
      updateContactDto,
    );

    try {
      return await this.contactsRepository.save(updatedContact);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Contact with email "${nextEmail}" already exists`,
        );
      }

      throw new InternalServerErrorException(
        'Unexpected error updating contact',
      );
    }
  }

  public async remove(id: string): Promise<void> {
    const existingContact: Contact = await this.findOne(id);

    try {
      await this.contactsRepository.softRemove(existingContact);
    } catch {
      throw new InternalServerErrorException(
        'Unexpected error deleting contact',
      );
    }
  }

  private async ensureEmailIsUnique(
    email: string,
    ignoreContactId?: string,
  ): Promise<void> {
    let existingContact: Contact | null;

    try {
      existingContact = await this.contactsRepository.findOne({
        where: { email },
      });
    } catch {
      throw new InternalServerErrorException(
        'Unexpected error validating contact email',
      );
    }

    if (existingContact && existingContact.id !== ignoreContactId) {
      throw new ConflictException(
        `Contact with email "${email}" already exists`,
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const databaseError: { code?: string } = error as { code?: string };
    return databaseError.code === ContactsService.UNIQUE_VIOLATION_CODE;
  }
}
