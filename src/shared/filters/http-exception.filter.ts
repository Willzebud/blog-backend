import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    const { status, message } = this.getErrorResponse(exception);

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorResponse(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      return {
        status: exception.getStatus(),
        message:
          typeof response === 'string'
            ? response
            : ((response as { message?: string | string[] }).message ??
              exception.message),
      };
    }

    if (exception instanceof MongooseError.ValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: Object.values(exception.errors).map((error) => error.message),
      };
    }

    if (
      exception instanceof Error &&
      'code' in exception &&
      exception.code === 11000
    ) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Une ressource avec ces informations existe déjà',
      };
    }

    if (
      exception instanceof Error &&
      'status' in exception &&
      typeof exception.status === 'number' &&
      exception.status >= 400 &&
      exception.status <= 599
    ) {
      return {
        status: exception.status,
        message:
          exception.status < 500
            ? (HttpStatus[exception.status] ?? 'Erreur HTTP')
            : 'Internal server error',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
