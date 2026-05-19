'use client';

import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { ListingGalleryImage } from '@/lib/listing-images';

type Props = {
  images: ListingGalleryImage[];
  variant?: 'card' | 'detail';
  className?: string;
};

export default function ImageCarousel({ images, variant = 'detail', className }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    suppressClick: false,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => images.slice(0, 4), [images]);

  function syncActiveIndex() {
    const viewport = viewportRef.current;
    if (!viewport || slides.length === 0) return;
    const nextIndex = Math.min(slides.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth));
    setActiveIndex(nextIndex);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport || slides.length < 2) return;

    dragStateRef.current = {
      pointerId: e.pointerId,
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: viewport.scrollLeft,
      suppressClick: false,
    };
    viewport.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    const viewport = viewportRef.current;
    if (!viewport || !state.isDragging || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > 4) {
      state.suppressClick = true;
    }
    viewport.scrollLeft = state.startScrollLeft - dx;
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    const viewport = viewportRef.current;
    if (!viewport || state.pointerId !== e.pointerId) return;

    state.isDragging = false;
    if (viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId);
    }
    if (state.suppressClick) {
      window.setTimeout(() => {
        state.suppressClick = false;
      }, 0);
    }
  }

  const suppressClick = () => dragStateRef.current.suppressClick;

  const carouselClassName = ['image-carousel', `image-carousel--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div
      className={carouselClassName}
      onClickCapture={(e) => {
        if (suppressClick()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        ref={viewportRef}
        className="image-carousel__viewport"
        onScroll={syncActiveIndex}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        {slides.map((image, index) => (
          <figure className="image-carousel__slide" key={`${image.label}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="image-carousel__image" src={image.src} alt={image.label} draggable={false} />
            <figcaption className="image-carousel__badge">{image.label}</figcaption>
          </figure>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="image-carousel__pager" aria-hidden="true">
          {slides.map((_, index) => (
            <i key={index} className={index === activeIndex ? 'on' : ''} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
