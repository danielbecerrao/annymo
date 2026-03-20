import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ContactsModule } from './contacts/contacts.module';

const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const dbHost: string = process.env.DB_HOST ?? 'localhost';
  const dbPortRaw: string = process.env.DB_PORT ?? '5432';
  const dbPortParsed: number = Number.parseInt(dbPortRaw, 10);
  const dbPort: number = Number.isNaN(dbPortParsed) ? 5432 : dbPortParsed;
  const dbUser: string = process.env.DB_USER ?? 'postgres';
  const dbPassword: string = process.env.DB_PASSWORD ?? 'postgres';
  const dbName: string = process.env.DB_NAME ?? 'fullstack_db';

  return {
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPassword,
    database: dbName,
    uuidExtension: 'pgcrypto',
    installExtensions: true,
    autoLoadEntities: true,
    synchronize: true,
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    ContactsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
