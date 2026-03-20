import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactWebhookDto } from './dto/create-contact-webhook.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

type MockRepository<T extends object = object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ContactsService', () => {
  let service: ContactsService;
  let repository: MockRepository<Contact>;

  const baseDate: Date = new Date('2026-03-20T01:00:00.000Z');
  const baseContactId: string = '7f0f1cba-9f19-4f7e-b4ef-22e7757a54ef';

  const createContactDto: CreateContactDto = {
    fullName: 'Ana Becerra',
    email: 'ana@example.com',
    phone: '3001234567',
    message: 'Hola, quiero informacion sobre los servicios disponibles.',
    source: 'landing-page',
    eventType: 'contact-submitted',
  };

  const createWebhookDto: CreateContactWebhookDto = {
    source: 'landing-page',
    eventType: 'contact-submitted',
    payload: {
      fullName: 'Ana Becerra',
      email: 'ana@example.com',
      phone: '3001234567',
      message: 'Hola, quiero informacion sobre los servicios disponibles.',
    } as CreateContactWebhookDto['payload'],
  };

  const buildContact = (overrides: Partial<Contact> = {}): Contact =>
    ({
      id: baseContactId,
      fullName: createContactDto.fullName,
      email: createContactDto.email,
      phone: createContactDto.phone,
      message: createContactDto.message,
      source: createContactDto.source ?? 'manual',
      eventType: createContactDto.eventType ?? 'contact_created',
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    }) as Contact;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('creates a contact successfully', async () => {
    const createdContact: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(null);
    repository.create!.mockReturnValue(createdContact);
    repository.save!.mockResolvedValue(createdContact);

    const result: Contact = await service.create(createContactDto);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: createContactDto.email },
    });
    expect(repository.create).toHaveBeenCalledWith(createContactDto);
    expect(repository.save).toHaveBeenCalledWith(createdContact);
    expect(result).toEqual(createdContact);
  });

  it('creates a contact with default source and eventType', async () => {
    const dtoWithoutOptionalFields: CreateContactDto = {
      fullName: 'Carlos Perez',
      email: 'carlos@example.com',
      message: 'Necesito soporte tecnico.',
    };
    const createdContact: Contact = buildContact({
      fullName: dtoWithoutOptionalFields.fullName,
      email: dtoWithoutOptionalFields.email,
      phone: undefined,
      message: dtoWithoutOptionalFields.message,
      source: 'manual',
      eventType: 'contact_created',
    });

    repository.findOne!.mockResolvedValueOnce(null);
    repository.create!.mockReturnValue(createdContact);
    repository.save!.mockResolvedValue(createdContact);

    const result: Contact = await service.create(dtoWithoutOptionalFields);

    expect(repository.create).toHaveBeenCalledWith({
      ...dtoWithoutOptionalFields,
      source: 'manual',
      eventType: 'contact_created',
    });
    expect(result).toEqual(createdContact);
  });

  it('creates a contact from webhook payload', async () => {
    const createdContact: Contact = buildContact();
    const createSpy = jest
      .spyOn(service, 'create')
      .mockResolvedValue(createdContact);

    const result: Contact = await service.createFromWebhook(createWebhookDto);

    expect(createSpy).toHaveBeenCalledWith({
      fullName: createWebhookDto.payload.fullName,
      email: createWebhookDto.payload.email,
      phone: createWebhookDto.payload.phone,
      message: createWebhookDto.payload.message,
      source: createWebhookDto.source,
      eventType: createWebhookDto.eventType,
    });
    expect(result).toEqual(createdContact);
  });

  it('throws 409 when creating with duplicated email', async () => {
    repository.findOne!.mockResolvedValueOnce(
      buildContact({ id: 'existing-id' }),
    );

    await expect(service.create(createContactDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws 500 when checking unique email fails', async () => {
    repository.findOne!.mockRejectedValueOnce(new Error('db unavailable'));

    await expect(service.create(createContactDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws 409 when save fails by unique violation code', async () => {
    const createdContact: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(null);
    repository.create!.mockReturnValue(createdContact);
    repository.save!.mockRejectedValueOnce({ code: '23505' });

    await expect(service.create(createContactDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws 500 when save fails unexpectedly in create', async () => {
    const createdContact: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(null);
    repository.create!.mockReturnValue(createdContact);
    repository.save!.mockRejectedValueOnce(new Error('unexpected'));

    await expect(service.create(createContactDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws 500 when save fails with non-object error in create', async () => {
    const createdContact: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(null);
    repository.create!.mockReturnValue(createdContact);
    repository.save!.mockRejectedValueOnce('db string error');

    await expect(service.create(createContactDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('returns all contacts ordered by createdAt desc', async () => {
    const contacts: Contact[] = [buildContact()];
    repository.find!.mockResolvedValueOnce(contacts);

    const result: Contact[] = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(contacts);
  });

  it('throws 500 when findAll fails', async () => {
    repository.find!.mockRejectedValueOnce(new Error('unexpected'));

    await expect(service.findAll()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('returns one contact by id', async () => {
    const contact: Contact = buildContact();
    repository.findOne!.mockResolvedValueOnce(contact);

    const result: Contact = await service.findOne(baseContactId);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: baseContactId },
    });
    expect(result).toEqual(contact);
  });

  it('throws 404 when contact is not found by id', async () => {
    repository.findOne!.mockResolvedValueOnce(null);

    await expect(service.findOne(baseContactId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws 500 when findOne fails by id', async () => {
    repository.findOne!.mockRejectedValueOnce(new Error('unexpected'));

    await expect(service.findOne(baseContactId)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('updates a contact without changing email', async () => {
    const current: Contact = buildContact();
    const updateDto: UpdateContactDto = { message: 'Mensaje actualizado.' };
    const merged: Contact = buildContact({ message: updateDto.message });

    repository.findOne!.mockResolvedValueOnce(current);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValueOnce(merged);

    const result: Contact = await service.update(baseContactId, updateDto);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.merge).toHaveBeenCalledWith(current, updateDto);
    expect(repository.save).toHaveBeenCalledWith(merged);
    expect(result).toEqual(merged);
  });

  it('updates a contact changing email when new email is unique', async () => {
    const current: Contact = buildContact();
    const updateDto: UpdateContactDto = { email: 'new@mail.com' };
    const merged: Contact = buildContact({ email: updateDto.email });

    repository
      .findOne!.mockResolvedValueOnce(current)
      .mockResolvedValueOnce(null);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValueOnce(merged);

    const result: Contact = await service.update(baseContactId, updateDto);

    expect(repository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: baseContactId },
    });
    expect(repository.findOne).toHaveBeenNthCalledWith(2, {
      where: { email: updateDto.email },
    });
    expect(result).toEqual(merged);
  });

  it('throws 409 when updating email to an existing one', async () => {
    const current: Contact = buildContact();
    const updateDto: UpdateContactDto = { email: 'existing@mail.com' };
    const duplicated: Contact = buildContact({
      id: 'another-id',
      email: updateDto.email,
    });

    repository
      .findOne!.mockResolvedValueOnce(current)
      .mockResolvedValueOnce(duplicated);

    await expect(
      service.update(baseContactId, updateDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 409 when update save hits unique violation', async () => {
    const current: Contact = buildContact();
    const updateDto: UpdateContactDto = { email: 'new@mail.com' };
    const merged: Contact = buildContact({ email: updateDto.email });

    repository
      .findOne!.mockResolvedValueOnce(current)
      .mockResolvedValueOnce(null);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.update(baseContactId, updateDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 500 when update save fails unexpectedly', async () => {
    const current: Contact = buildContact();
    const updateDto: UpdateContactDto = { message: 'otro' };
    const merged: Contact = buildContact({ message: updateDto.message });

    repository.findOne!.mockResolvedValueOnce(current);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockRejectedValueOnce(new Error('unexpected'));

    await expect(
      service.update(baseContactId, updateDto),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('removes a contact successfully', async () => {
    const current: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(current);
    repository.softRemove!.mockResolvedValueOnce(current);

    await expect(service.remove(baseContactId)).resolves.toBeUndefined();
    expect(repository.softRemove).toHaveBeenCalledWith(current);
  });

  it('throws 500 when remove fails', async () => {
    const current: Contact = buildContact();

    repository.findOne!.mockResolvedValueOnce(current);
    repository.softRemove!.mockRejectedValueOnce(new Error('unexpected'));

    await expect(service.remove(baseContactId)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
