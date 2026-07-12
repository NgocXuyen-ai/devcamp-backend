import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recall, RecallSchema } from './schemas/recall.schema';
import { RecallService } from './recall.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Recall.name, schema: RecallSchema }]),
    ],
    providers: [RecallService],
    exports: [RecallService],
})
export class RecallModule { }