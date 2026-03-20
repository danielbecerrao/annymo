import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { ContactsController } from '../src/contacts/contacts.controller';
import { ContactsService } from '../src/contacts/contacts.service';
import { Contact } from '../src/contacts/entities/contact.entity';

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

describe('ContactsController (e2e)', () => {
  let app: INestApplication;
  const server = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const contactsServiceMock: ContactsServiceMock = {
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

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: contactsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /contacts/webhook returns 400 for invalid payload', () => {
    return request(server())
      .post('/contacts/webhook')
      .send({
        source: 'landing-page',
        eventType: 'contact-submitted',
        payload: {
          fullName: 'Ana',
        },
      })
      .expect(400);
  });

  it('POST /contacts/webhook creates a contact', async () => {
    const createdContact: Contact = {
      id: '7f0f1cba-9f19-4f7e-b4ef-22e7757a54ef',
      fullName: 'Ana Becerra',
      email: 'ana@example.com',
      message: 'Hola, quiero informacion sobre los servicios disponibles.',
      source: 'landing-page',
      eventType: 'contact-submitted',
    } as Contact;

    contactsServiceMock.createFromWebhook.mockResolvedValue(createdContact);

    await request(server())
      .post('/contacts/webhook')
      .send({
        source: 'landing-page',
        eventType: 'contact-submitted',
        payload: {
          fullName: 'Ana Becerra',
          email: 'ana@example.com',
          message: 'Hola, quiero informacion sobre los servicios disponibles.',
          phone: '3001234567',
        },
      })
      .expect(201)
      .expect(createdContact);
  });

  it('GET /contacts/:id returns 404 when contact does not exist', () => {
    contactsServiceMock.findOne.mockRejectedValue(
      new NotFoundException('Contact with id "not-found" not found'),
    );

    return request(server())
      .get('/contacts/7f0f1cba-9f19-4f7e-b4ef-22e7757a54ef')
      .expect(404);
  });

  it('GET /contacts returns contacts', async () => {
    const contacts: Contact[] = [
      {
        id: '7f0f1cba-9f19-4f7e-b4ef-22e7757a54ef',
        fullName: 'Ana Becerra',
        email: 'ana@example.com',
      },
    ] as Contact[];

    contactsServiceMock.findAll.mockResolvedValue(contacts);

    await request(server()).get('/contacts').expect(200).expect(contacts);
  });

  afterAll(async () => {
    await app.close();
  });
});
