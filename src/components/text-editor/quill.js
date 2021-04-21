import Quill from 'quill';
import { ImageDrop } from 'quill-image-drop-module';
import DOMPurify from 'dompurify';

Quill.register('modules/imageDrop', ImageDrop);

export const quill = (node, content = '') => {
  const q = new Quill(node, {
    modules: {
      imageDrop: false,
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        ['bold', 'italic', 'underline'],
        ['link'],
        ['clean']
      ]
    },
    placeholder: '',
    theme: 'snow' // or 'bubble'
  });

  q.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(content));

  const container = node.getElementsByClassName('ql-editor')[0];

  const handler = (delta, oldDelta, source) => {
    node.dispatchEvent(
      new CustomEvent('text-change', {
        detail: {
          html: container.innerHTML
        }
      })
    );
  };

  q.on('text-change', handler);

  return () => q.off('text-change', handler);
};