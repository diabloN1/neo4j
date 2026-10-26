import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";

@Directive({
  selector: "[appObserveVisible]",
  standalone: true,
})
export class ObserveVisibleDirective
  implements AfterViewInit, OnChanges, OnDestroy
{
  private readonly element = inject(ElementRef<HTMLElement>);

  private observer?: IntersectionObserver;
  private viewInitialized = false;

  @Input() appObserveVisible = false;
  @Output() visible = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.updateObservation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["appObserveVisible"] && this.viewInitialized) {
      this.updateObservation();
    }
  }

  private updateObservation(): void {
    this.observer?.disconnect();
    this.observer = undefined;

    if (
      !this.appObserveVisible ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible.emit();
        }
      },
      {
        root: null,
        rootMargin: "600px 0px",
        threshold: 0,
      },
    );

    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.visible.complete();
  }
}
