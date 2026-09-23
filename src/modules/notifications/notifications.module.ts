import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { NotificationsService } from './notifications.service';
@Module({ imports: [MailModule], providers: [NotificationsService] })
export class NotificationsModule {}
