"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function clampIndex(index, total) {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

function getDefaultItemId(item, index) {
  return item?.id ?? item?.key ?? String(index);
}

export default function Slider({
  id,
  eyebrow,
  title,
  items = [],
  selectedId = "",
  emptyMessage = "No hay elementos para mostrar.",
  getItemId = getDefaultItemId,
  renderItem,
  onActiveItemChange,
  className = "",
  showHeader = true,
  showCounter = true
}) {
  const trackRef = useRef(null);
  const frameRef = useRef(0);
  const navMouseDownHandledRef = useRef(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const itemIds = useMemo(
    () => items.map((item, index) => getItemId(item, index)),
    [getItemId, items]
  );
  const selectedIndex = selectedId ? itemIds.indexOf(selectedId) : -1;
  const activeIndex = clampIndex(selectedIndex === -1 ? visibleIndex : selectedIndex, items.length);
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!items.length) {
      setVisibleIndex(0);
      return;
    }

    if (selectedIndex >= 0) {
      setVisibleIndex(selectedIndex);
    }
  }, [items.length, selectedIndex]);

  useEffect(() => {
    const track = trackRef.current;

    if (!track || selectedIndex < 0) return;

    const targetLeft = track.clientWidth * selectedIndex;

    if (Math.abs(track.scrollLeft - targetLeft) > 2) {
      track.scrollLeft = targetLeft;
    }
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const updateActiveIndexFromScroll = () => {
    const track = trackRef.current;

    if (!track || !items.length) return;

    const nextIndex = clampIndex(
      Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)),
      items.length
    );

    setVisibleIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));

    if (selectedIndex === -1 || nextIndex !== selectedIndex) {
      onActiveItemChange?.(items[nextIndex], nextIndex);
    }
  };

  const handleTrackScroll = () => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(updateActiveIndexFromScroll);
  };

  const scrollToIndex = (index) => {
    const track = trackRef.current;
    const nextIndex = clampIndex(index, items.length);

    if (!track) return;

    track.scrollLeft = track.clientWidth * nextIndex;
    setVisibleIndex(nextIndex);
    onActiveItemChange?.(items[nextIndex], nextIndex);
  };

  const handleNavMouseDown = (event, index) => {
    if (event.button !== 0) return;

    event.preventDefault();
    navMouseDownHandledRef.current = true;
    window.setTimeout(() => {
      navMouseDownHandledRef.current = false;
    }, 250);
    scrollToIndex(index);
  };

  const handleNavClick = (index) => {
    if (navMouseDownHandledRef.current) {
      navMouseDownHandledRef.current = false;
      return;
    }

    scrollToIndex(index);
  };

  return (
    <section
      className={`slider-section property-slider-section ${className}`.trim()}
      aria-label={showHeader ? undefined : title}
      aria-labelledby={showHeader ? titleId : undefined}
    >
      <div className="slider-shell property-slider-shell">
        {showHeader ? (
          <div className="slider-copy property-slider-copy">
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h3 id={titleId}>{title}</h3>
          </div>
        ) : null}
        {showCounter ? (
          <div className="slider-counter property-slider-counter" aria-label={`${title}: slide actual`}>
            {items.length ? activeIndex + 1 : 0} / {items.length}
          </div>
        ) : null}

        <div className="slider-viewport property-slider-viewport">
          <button
            type="button"
            className="slider-nav slider-nav--prev property-slider-nav property-slider-nav--prev"
            onMouseDown={(event) => handleNavMouseDown(event, activeIndex - 1)}
            onClick={() => handleNavClick(activeIndex - 1)}
            disabled={items.length <= 1 || activeIndex === 0}
            aria-label={`Deslizar ${title} hacia la izquierda`}
          />
          <div
            className="slider-track property-slider-track"
            ref={trackRef}
            onScroll={handleTrackScroll}
          >
            {items.length ? (
              items.map((item, index) => {
                const itemId = getItemId(item, index);

                return (
                  <article
                    className={`slider-slide property-slide ${index === activeIndex ? "active" : ""}`}
                    data-slider-item-id={itemId}
                    key={itemId}
                  >
                    {renderItem?.({
                      active: index === activeIndex,
                      index,
                      item
                    })}
                  </article>
                );
              })
            ) : (
              <div className="slider-empty property-slider-empty" role="status">
                {emptyMessage}
              </div>
            )}
          </div>
          <button
            type="button"
            className="slider-nav slider-nav--next property-slider-nav property-slider-nav--next"
            onMouseDown={(event) => handleNavMouseDown(event, activeIndex + 1)}
            onClick={() => handleNavClick(activeIndex + 1)}
            disabled={items.length <= 1 || activeIndex >= items.length - 1}
            aria-label={`Deslizar ${title} hacia la derecha`}
          />
        </div>
      </div>
    </section>
  );
}
