import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactWebhookDto } from './dto/create-contact-webhook.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

type ContactsServiceMock = {
  create: jest.Mock<
    ReturnType<ContactsService['create']>,
    Parameters<ContactsService['create']>
  >;
  createFromWebhook: jest.Mock<
    ReturnType<ContactsService['createFromWebhook']>,
    Parameters<ContactsService['createFromWebhook']>
  >;
  findAll: jest.Mock<
    ReturnType<ContactsService['findAll']>,
    Parameters<ContactsService['findAll']>
  >;
  findOne: jest.Mock<
    ReturnType<ContactsService['findOne']>,
    Parameters<ContactsService['findOne']>
  >;
  update: jest.Mock<
    ReturnType<ContactsService['update']>,
    Parameters<ContactsService['update']>
  >;
  remove: jest.Mock<
    ReturnType<ContactsService['remove']>,
    Parameters<ContactsService['remove']>
  >;
};

describe('ContactsController', () => {
  let controller: ContactsController;
  let contactsServiceMock: ContactsServiceMock;

  const createContactDto: CreateContactDto = {
    fullName: 'Ana Becerra',
    email: 'ana@example.com',
    message: 'Hola, quiero informacion de sus servicios.',
    phone: '3001234567',
    source: 'landing-page',
    eventType: 'contact-submitted',
  };

  const createContactWebhookDto: CreateContactWebhookDto = {
    source: 'landing-page',
    eventType: 'contact-submitted',
    payload: {
      fullName: 'Ana Becerra',
      email: 'ana@example.com',
      message: 'Hola, quiero informacion de sus servicios.',
      phone: '3001234567',
    } as CreateContactWebhookDto['payload'],
  };

  const updateContactDto: UpdateContactDto = {
    message: 'Mensaje actualizado.',
  };

  const contact: Contact = {
    id: '7f0f1cba-9f19-4f7e-b4ef-22e7757a54ef',
    fullName: 'Ana Becerra',
    email: 'ana@example.com',
    phone: '3001234567',
    message: 'Hola, quiero informacion de sus servicios.',
    source: 'landing-page',
    eventType: 'contact-submitted',
    createdAt: new Date('2026-03-19T20:00:00.000Z'),
    updatedAt: new Date('2026-03-19T20:00:00.000Z'),
  };

  beforeEach(async () => {
    contactsServiceMock = {
      create: jest.fn<
        ReturnType<ContactsService['create']>,
        Parameters<ContactsService['create']>
      >(),
      createFromWebhook: jest.fn<
        ReturnType<ContactsService['createFromWebhook']>,
        Parameters<ContactsService['createFromWebhook']>
      >(),
      findAll: jest.fn<
        ReturnType<ContactsService['findAll']>,
        Parameters<ContactsService['findAll']>
      >(),
      findOne: jest.fn<
        ReturnType<ContactsService['findOne']>,
        Parameters<ContactsService['findOne']>
      >(),
      update: jest.fn<
        ReturnType<ContactsService['update']>,
        Parameters<ContactsService['update']>
      >(),
      remove: jest.fn<
        ReturnType<ContactsService['remove']>,
        Parameters<ContactsService['remove']>
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: contactsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create delegates to ContactsService.create', async () => {
    contactsServiceMock.create.mockResolvedValue(contact);

    const result: Contact = await controller.create(createContactDto);

    expect(contactsServiceMock.create).toHaveBeenCalledWith(createContactDto);
    expect(result).toEqual(contact);
  });

  it('createWebhook delegates to ContactsService.createFromWebhook', async () => {
    contactsServiceMock.createFromWebhook.mockResolvedValue(contact);

    const result: Contact = await controller.createWebhook(
      createContactWebhookDto,
    );

    expect(contactsServiceMock.createFromWebhook).toHaveBeenCalledWith(
      createContactWebhookDto,
    );
    expect(result).toEqual(contact);
  });

  it('findAll delegates to ContactsService.findAll', async () => {
    const contacts: Contact[] = [contact];
    contactsServiceMock.findAll.mockResolvedValue(contacts);

    const result: Contact[] = await controller.findAll();

    expect(contactsServiceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual(contacts);
  });

  it('findOne delegates to ContactsService.findOne', async () => {
    contactsServiceMock.findOne.mockResolvedValue(contact);

    const result: Contact = await controller.findOne(contact.id);

    expect(contactsServiceMock.findOne).toHaveBeenCalledWith(contact.id);
    expect(result).toEqual(contact);
  });

  it('update delegates to ContactsService.update', async () => {
    const updatedContact: Contact = {
      ...contact,
      message: 'Mensaje actualizado.',
      updatedAt: new Date('2026-03-20T20:00:00.000Z'),
    };

    contactsServiceMock.update.mockResolvedValue(updatedContact);

    const result: Contact = await controller.update(
      contact.id,
      updateContactDto,
    );

    expect(contactsServiceMock.update).toHaveBeenCalledWith(
      contact.id,
      updateContactDto,
    );
    expect(result).toEqual(updatedContact);
  });

  it('remove delegates to ContactsService.remove', async () => {
    contactsServiceMock.remove.mockResolvedValue(undefined);

    const result: void = await controller.remove(contact.id);

    expect(contactsServiceMock.remove).toHaveBeenCalledWith(contact.id);
    expect(result).toBeUndefined();
  });
});
