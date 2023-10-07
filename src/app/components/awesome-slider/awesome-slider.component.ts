import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent, Subject } from 'rxjs';
import {
  switchMap,
  takeUntil,
  throttleTime,
  debounceTime,
  tap,
} from 'rxjs/operators';
import { AwesomeSliderService } from './awesome-slider.service';

@Component({
  selector: 'app-awesome-slider',
  templateUrl: './awesome-slider.component.html',
  styleUrls: ['./awesome-slider.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AwesomeSliderComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwesomeSliderComponent
  implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('sliderTrack', { static: true }) readonly sliderTrack!: ElementRef;
  @Input() minValue = 0;
  @Input() maxValue = 100;
  @Input() tickStep = 10;
  @Input() colorPalette = ['#3e8aff', '#00d5c0', '#f5c200', '#ff4500'];

  readonly handles$ = this.sliderService.handles$;
  readonly segments$ = this.sliderService.segments$;
  readonly dragEnd$ = new Subject<void>();
  private readonly destroyed$ = new Subject<void>();

  private animationFrameId: number | null = null;
  private isDragging: boolean = false;

  private onChange: (value: { id: number; value: number }[]) => void = () => { };
  private onTouched: () => void = () => { };

  protected ticks: number[] = [];
  protected draggedId: number | null = null;

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly zone: NgZone,
    private readonly sliderService: AwesomeSliderService
  ) { }

  ngOnInit(): void {
    this.ticks = this.sliderService.initService(
      this.minValue,
      this.maxValue,
      this.tickStep,
      this.colorPalette
    );

    this.listenToMouseEvents();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  writeValue(value: number[]): void {
    this.sliderService.updateValue(value);
    this.sliderService.updateSegments(
      this.minValue,
      this.maxValue,
      this.colorPalette
    );
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onMouseDown(event: MouseEvent, handle: { id: number; value: number }) {
    event.preventDefault();
    this.draggedId = handle.id;
  }

  private listenToMouseEvents() {
    this.zone.runOutsideAngular(() => {
      this.listenToMouseDown();
      this.listenToMouseUp();
    });
  }

  private listenToMouseDown() {
    fromEvent<MouseEvent>(document, 'mousedown')
      .pipe(
        tap(() => {
          this.isDragging = true;
        }),
        switchMap(() => this.getMouseMoveStream()),
        this.takeUntilDestroyed()
      )
      .subscribe((event) => this.handleDrag(event as MouseEvent));
  }

  private getMouseMoveStream() {
    return fromEvent<MouseEvent>(document, 'mousemove').pipe(
      throttleTime(16),
      debounceTime(16),
      takeUntil(fromEvent(document, 'mouseup'))
    );
  }

  private listenToMouseUp() {
    fromEvent<MouseEvent>(document, 'mouseup')
      .pipe(this.takeUntilDestroyed())
      .subscribe(() => this.handleMouseUp());
  }

  private handleDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    this.animationFrameId && cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() =>
      this.handleMouseMove(event)
    );
  }

  private handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    this.zone.run(() => {
      this.dragEnd$.next();
      this.draggedId = null;
      const handles = [...this.handles$.getValue()].sort(
        (a, b) => a.value - b.value
      );
      this.onChange(handles);
      this.cd.detectChanges();
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.draggedId !== null) {
      const isUpdated = this.sliderService.handleMouseMove(event, this.sliderTrack, this.maxValue, this.minValue, this.draggedId, this.colorPalette)
      if (isUpdated) {
        this.zone.run(() => {
          this.cd.detectChanges();
        });
      }
    }
  }

  private takeUntilDestroyed() {
    return takeUntil(this.destroyed$);
  }
}
