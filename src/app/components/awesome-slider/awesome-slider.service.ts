import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AwesomeSliderService {
  readonly handles$ = new BehaviorSubject<{ id: number; value: number }[]>([
    { id: 1, value: 0 },
    { id: 2, value: 50 },
    { id: 3, value: 90 },
  ]);
  readonly segments$ = new BehaviorSubject<any[]>([]);

  initService(
    minValue: number,
    maxValue: number,
    tickStep: number,
    colorPalette: string[]
  ) {
    let ticks = this.initTicks(minValue, maxValue, tickStep);
    this.updateSegments(minValue, maxValue, colorPalette);
    this.handles$.getValue();
    return ticks;
  }

  initTicks(minValue: number, maxValue: number, tickStep: number): number[] {
    const ticks = [];
    for (let i = minValue; i <= maxValue; i += tickStep) {
      ticks.push(i);
    }
    return ticks;
  }

  updateSegments(
    minValue: number,
    maxValue: number,
    colorPalette: string[]
  ): void {
    const handles = [...this.handles$.getValue()].sort(
      (a, b) => a.value - b.value
    );
    const segments = this.calculateSegments(
      handles,
      minValue,
      maxValue,
      colorPalette
    );
    this.segments$.next([...segments]);
  }

  updateValue(value: number[]): void {
    const sortedValue = [...value].sort((a, b) => a - b);
    const handles = sortedValue.map((v, i) => {
      const existingHandle = this.handles$
        .getValue()
        .find((handle) => handle.value === v);
      return { id: existingHandle ? existingHandle.id : i + 1, value: v };
    });
    this.handles$.next([...handles]);
  }

  calculateHandleValue(
    clientX: number,
    sliderTrack: ElementRef,
    maxValue: number,
    minValue: number
  ): number {
    const rect = sliderTrack.nativeElement.getBoundingClientRect();
    let x = clientX - rect.left;
    let newValue = Math.round((x / rect.width) * maxValue);
    return Math.min(maxValue, Math.max(minValue, newValue));
  }

  calculateSegments(
    handles: { id: number; value: number }[],
    minValue: number,
    maxValue: number,
    colorPalette: string[]
  ): any[] {
    const segments: any[] = [];

    for (let i = 0; i <= handles.length; i++) {
      const left = i === 0 ? minValue : handles[i - 1].value;
      const right = i === handles.length ? maxValue : handles[i].value;
      const color = colorPalette[i % colorPalette.length];
      segments.push({ left, right, color });
    }

    return segments;
  }

  handleMouseMove(event: MouseEvent, sliderTrack: ElementRef, maxValue: number, minValue: number, draggedId: number, colorPalette: string[]) {
    const correctedValue = this.calculateHandleValue(
      event.clientX,
      sliderTrack,
      maxValue,
      minValue
    );
    const handles = [...this.handles$.getValue()];
    const index = handles.findIndex((h) => h.id === draggedId);
    if (index > -1 && handles[index].value !== correctedValue) {
      handles[index].value = correctedValue;
      handles.sort((a, b) => a.value - b.value);
      this.handles$.next(handles);
      this.updateSegments(
        minValue,
        maxValue,
        colorPalette
      );
      return true
    }
    return false;
  }
}
