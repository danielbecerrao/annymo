import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactWebhookDto } from './dto/create-contact-webhook.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

@Controller('contacts')
export class ContactsController {
  public constructor(private readonly contactsService: ContactsService) {}

  @Post()
  public create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactsService.create(createContactDto);
  }

  @Post('webhook')
  public createWebhook(
    @Body() createContactWebhookDto: CreateContactWebhookDto,
  ): Promise<Contact> {
    return this.contactsService.createFromWebhook(createContactWebhookDto);
  }

  @Get()
  public findAll(): Promise<Contact[]> {
    return this.contactsService.findAll();
  }

  @Get(':id')
  public findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Contact> {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  public update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @HttpCode(204)
  public remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contactsService.remove(id);
  }
}
