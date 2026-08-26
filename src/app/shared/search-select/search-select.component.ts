import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SearchSelectOption {
  id: number | string;
  label: string;
}

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.scss',
})
export class SearchSelectComponent {
  @Input() placeholder = 'الكل';
  @Input() options: SearchSelectOption[] = [];
  @Input() loading = false;
  @Input() selectedLabel = '';

  @Output() search = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<SearchSelectOption | null>();

  isOpen = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor(private elementRef: ElementRef) {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.search.emit(term);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  open(): void {
    this.isOpen = true;
    this.searchSubject.next(this.searchTerm);
  }

  onSearchInput(): void {
    this.isOpen = true;
    this.searchSubject.next(this.searchTerm);
  }

  selectOption(option: SearchSelectOption): void {
    this.selectedLabel = option.label;
    this.searchTerm = '';
    this.isOpen = false;
    this.valueChange.emit(option);
  }

  clearSelection(): void {
    this.selectedLabel = '';
    this.searchTerm = '';
    this.isOpen = false;
    this.valueChange.emit(null);
    this.search.emit('');
  }

  /** يستخدم من الأب لتصفير القيمة المختارة دون إطلاق أحداث (عند تفريغ الفلتر بالكامل). */
  reset(): void {
    this.selectedLabel = '';
    this.searchTerm = '';
    this.isOpen = false;
  }
}
