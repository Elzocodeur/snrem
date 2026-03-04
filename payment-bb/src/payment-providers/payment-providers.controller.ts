import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentProvidersService } from './payment-providers.service';
import { CreatePaymentProviderDto } from './dto/create-payment-provider.dto';
import { UpdatePaymentProviderDto } from './dto/update-payment-provider.dto';
import { Public } from '../common/decorators';

@ApiTags('providers')
@ApiBearerAuth()
@Controller('providers')
export class PaymentProvidersController {
  constructor(
    private readonly paymentProvidersService: PaymentProvidersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment provider (Admin only)' })
  create(@Body() createDto: CreatePaymentProviderDto) {
    return this.paymentProvidersService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all payment providers' })
  findAll(@Query('active') active?: string) {
    return this.paymentProvidersService.findAll(active === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment provider by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentProvidersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment provider (Admin only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePaymentProviderDto) {
    return this.paymentProvidersService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a payment provider (Admin only)' })
  activate(@Param('id') id: string) {
    return this.paymentProvidersService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a payment provider (Admin only)' })
  deactivate(@Param('id') id: string) {
    return this.paymentProvidersService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment provider (Admin only)' })
  remove(@Param('id') id: string) {
    return this.paymentProvidersService.remove(id);
  }
}
