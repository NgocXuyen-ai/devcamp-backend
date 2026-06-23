import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { PracticeEvaluationDto } from './dto/practice-evaluation.dto';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post('run')
  run(@Body() dto: PracticeEvaluationDto) {
    return this.exercisesService.run(dto);
  }

  @Post('submit')
  submit(@Body() dto: PracticeEvaluationDto) {
    return this.exercisesService.submit(dto);
  }

  @Get(':practiceId/submissions')
  getSubmissions(@Param('practiceId') practiceId: string) {
    return this.exercisesService.getSubmissions(practiceId);
  }
}
