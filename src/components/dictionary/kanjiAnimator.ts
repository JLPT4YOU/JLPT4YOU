/*
 * Kanji stroke animator from inline SVG paths
 * - No external deps; safe and simple
 */

export type Animator = {
  play(): void;
  pause(): void;
  reset(): void;
  clear(): void;
  isPlaying(): boolean;
  nextStroke(): void;
  previousStroke(): void;
  onFinish?: () => void;
};

export function createKanjiAnimator(svgContainer: HTMLElement, svgMarkup: string, opts?: { speed?: number }): Animator {
  // Sanitize and keep only the <svg> element; remove stray CDATA endings like ']]>' or ']>'
  const onlySvg = svgMarkup.match(/<svg[\s\S]*?<\/svg>/i)?.[0] ?? svgMarkup;
  const cleaned = onlySvg.replace(/]]>/g, '').replace(/]>+/g, '');
  svgContainer.innerHTML = cleaned; // svgMarkup should be sanitized beforehand or trusted from extraction
  const svg = svgContainer.querySelector('svg');
  if (!svg) {
    return { 
      play() {}, 
      pause() {}, 
      reset() {},
      clear() {},
      isPlaying: () => false,
      nextStroke() {},
      previousStroke() {}
    };
  }

  // Get all paths and text elements
  const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
  const texts = Array.from(svg.querySelectorAll('text')) as SVGTextElement[];
  
  // Try order by id like ...-s1, ...-s2,... else keep DOM order
  paths.sort((a, b) => {
    const ai = parseInt(a.id?.match(/-s(\d+)/)?.[1] || '0', 10);
    const bi = parseInt(b.id?.match(/-s(\d+)/)?.[1] || '0', 10);
    return ai - bi;
  });

  // Hide all stroke numbers initially
  texts.forEach(t => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s';
  });

  const lengths = paths.map((p) => {
    const len = Math.ceil(p.getTotalLength());
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    // Store original stroke color
    p.setAttribute('data-original-stroke', p.getAttribute('stroke') || '#000000');
    return len;
  });

  let playing = false;
  let idx = 0;
  let strokeProgress = 0; // Track how many strokes are fully shown
  let raf = 0;
  let animatingStroke = -1; // Track which stroke is being animated
  let onFinishCb: (() => void) | undefined;
  const speed = Math.max(0.3, Math.min(opts?.speed ?? 1, 3)); // 0.3x .. 3x

  // Animate a specific stroke
  function animateStroke(strokeIdx: number, onComplete?: () => void) {
    if (strokeIdx < 0 || strokeIdx >= paths.length) return;
    
    const p = paths[strokeIdx];
    const len = lengths[strokeIdx];
    const strokeNum = strokeIdx + 1;
    const text = texts.find(t => t.textContent === strokeNum.toString());
    
    // Start animation
    animatingStroke = strokeIdx;
    p.style.strokeDashoffset = `${len}`;
    p.setAttribute('stroke', '#ff0000');
    
    // Show stroke number
    if (text) {
      text.style.opacity = '1';
    }
    
    const animateStep = () => {
      if (animatingStroke !== strokeIdx) return;
      
      const cur = parseFloat(p.style.strokeDashoffset || `${len}`);
      const delta = Math.max(1, len * 0.02 * speed * 2); // Faster for single stroke
      const next = Math.max(0, cur - delta);
      
      p.style.strokeDashoffset = `${next}`;
      
      if (next <= 0) {
        // Animation complete
        const originalColor = p.getAttribute('data-original-stroke') || '#000000';
        p.setAttribute('stroke', originalColor);
        animatingStroke = -1;
        if (onComplete) onComplete();
      } else {
        requestAnimationFrame(animateStep);
      }
    };
    
    requestAnimationFrame(animateStep);
  }

  // Hide a specific stroke
  function hideStroke(strokeIdx: number) {
    if (strokeIdx < 0 || strokeIdx >= paths.length) return;
    
    const p = paths[strokeIdx];
    const strokeNum = strokeIdx + 1;
    const text = texts.find(t => t.textContent === strokeNum.toString());
    
    // Hide the stroke
    p.style.strokeDashoffset = `${lengths[strokeIdx]}`;
    
    // Hide stroke number
    if (text) {
      text.style.opacity = '0';
    }
  }

  const step = () => {
    if (!playing) return;
    const p = paths[idx];
    if (!p) return;
    const len = lengths[idx];

    const cur = parseFloat(p.style.strokeDashoffset || `${len}`);
    const delta = Math.max(1, len * 0.02 * speed); // per frame
    const next = Math.max(0, cur - delta);
    
    // Set stroke to red while animating
    if (cur > 0 && next <= cur) {
      p.setAttribute('stroke', '#ff0000');
      // Show stroke number when stroke starts
      if (cur === len) {
        const strokeNum = idx + 1;
        const text = texts.find(t => t.textContent === strokeNum.toString());
        if (text) {
          text.style.opacity = '1';
        }
      }
    }
    
    p.style.strokeDashoffset = `${next}`;

    if (next <= 0) {
      // Restore original color when stroke is complete
      const originalColor = p.getAttribute('data-original-stroke') || '#000000';
      p.setAttribute('stroke', originalColor);
      
      strokeProgress = idx + 1;
      idx += 1;
      if (idx >= paths.length) {
        playing = false;
        // Call onFinish callback when animation completes
        if (onFinishCb) {
          onFinishCb();
        }
        return;
      }
    }
    raf = requestAnimationFrame(step);
  };

  function play() {
    if (playing) return;
    // If all strokes are shown, reset and play from beginning
    if (strokeProgress >= paths.length) {
      reset();
    }
    playing = true;
    idx = strokeProgress;
    raf = requestAnimationFrame(step);
  }
  
  function pause() {
    playing = false;
    if (raf) cancelAnimationFrame(raf);
  }
  
  function reset() {
    pause();
    idx = 0;
    strokeProgress = 0;
    paths.forEach((p, i) => {
      p.style.strokeDashoffset = `${lengths[i]}`;
      // Hide completely to avoid dot artifacts in some renderers
      p.setAttribute('stroke', 'transparent');
    });
    // Hide all stroke numbers
    texts.forEach(t => {
      t.style.opacity = '0';
    });
  }

  function nextStroke() {
    pause();
    if (strokeProgress < paths.length) {
      animateStroke(strokeProgress, () => {
        strokeProgress++;
        idx = strokeProgress;
      });
    }
  }

  // Animate erasing a specific stroke (increase dashoffset from 0 -> len)
  function animateEraseStroke(strokeIdx: number, onComplete?: () => void) {
    if (strokeIdx < 0 || strokeIdx >= paths.length) return;
    const p = paths[strokeIdx];
    const len = lengths[strokeIdx];
    const strokeNum = strokeIdx + 1;
    const text = texts.find(t => t.textContent === strokeNum.toString());

    animatingStroke = strokeIdx;
    // Ensure stroke is currently shown
    p.style.strokeDashoffset = '0';
    p.setAttribute('stroke', '#ff0000');

    const animateStep = () => {
      if (animatingStroke !== strokeIdx) return;
      const cur = parseFloat(p.style.strokeDashoffset || '0');
      const delta = Math.max(1, len * 0.02 * speed * 2);
      const next = Math.min(len, cur + delta);
      p.style.strokeDashoffset = `${next}`;
      if (next >= len) {
        // Hide number after fully erased
        if (text) text.style.opacity = '0';
        const originalColor = p.getAttribute('data-original-stroke') || '#000000';
        p.setAttribute('stroke', originalColor);
        animatingStroke = -1;
        if (onComplete) onComplete();
      } else {
        requestAnimationFrame(animateStep);
      }
    };
    requestAnimationFrame(animateStep);
  }

  function previousStroke() {
    pause();
    if (strokeProgress > 0) {
      const target = strokeProgress - 1;
      animateEraseStroke(target, () => {
        strokeProgress = target;
        idx = strokeProgress;
      });
    }
  }
  
  function clear() {
    // Use reset logic to avoid artifacts (dots) caused by opacity toggling
    reset();
  }

  // initialize paused state
  reset();

  const animator = {
    play,
    pause,
    reset,
    clear,
    isPlaying: () => playing,
    nextStroke,
    previousStroke,
    get onFinish() { return onFinishCb; },
    set onFinish(cb: (() => void) | undefined) { onFinishCb = cb; }
  };
  
  return animator;
}

