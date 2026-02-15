// src/app/pipes/trim.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trim',
  standalone: true
})
export class TrimPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return (value || '').trim();
  }
}
