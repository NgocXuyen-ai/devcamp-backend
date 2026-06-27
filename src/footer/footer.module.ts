import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminFooterController,
  PublicFooterController,
} from './footer.controller';
import { FooterService } from './footer.service';
import {
  FooterConfig,
  FooterConfigSchema,
} from './schemas/footer-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FooterConfig.name, schema: FooterConfigSchema },
    ]),
  ],
  controllers: [PublicFooterController, AdminFooterController],
  providers: [FooterService],
  exports: [FooterService],
})
export class FooterModule {}
