import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

/**
 * Shows pre-rendered topic HTML (built from our own Markdown files at build time).
 * Adds "Copy" buttons to code blocks and routes internal links through React Router.
 */
export default function Prose({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      pre.tabIndex = 0; // lets keyboard users scroll long code sideways
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code');
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
          btn.textContent = 'Copied ✓';
        } catch {
          btn.textContent = 'Press Ctrl+C';
        }
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      };
      wrap.appendChild(btn);
      // long commented lines are hard to read on a phone, so wrap them there by default
      const wrapBtn = document.createElement('button');
      wrapBtn.type = 'button';
      wrapBtn.className = 'copy-btn wrap-btn';
      const setWrap = (on: boolean) => {
        pre.classList.toggle('wrap', on);
        wrapBtn.textContent = on ? 'No wrap' : 'Wrap';
        wrapBtn.setAttribute('aria-pressed', String(on));
      };
      setWrap(window.matchMedia('(max-width: 639px)').matches);
      wrapBtn.onclick = () => setWrap(!pre.classList.contains('wrap'));
      wrap.appendChild(wrapBtn);
    });
  }, [html]);

  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (href?.startsWith('#/')) {
      e.preventDefault();
      navigate(href.slice(1));
    }
  };

  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  return <div ref={ref} className="topic-content" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
