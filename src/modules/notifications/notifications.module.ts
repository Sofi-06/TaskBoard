import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { TasksModule } from '../tasks/tasks.module';
import { NotificationsService } from './notifications.service';
@Module({ imports: [MailModule, TasksModule], providers: [NotificationsService] })
export class NotificationsModule {}
