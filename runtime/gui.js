

function render () {
      const backends = ['svg', current.backends.css && 'css'].filter(Boolean).join(' + ');
      els.title.textContent = `${current.name}  ·  ${current.id}  ·  ${backends}`;
      els.controls.replaceChildren();
      
  for (const [key, spec] of Object.entries(current.vars)) {
        const row = document.createElement('div');
        row.className = 'row';
        const numeric = spec.type === 'number' || spec.type === 'integer';
        if (spec.type === 'boolean') {
          row.innerHTML = `<label>${key}</label>
            <input type="checkbox" ${spec.default ? 'checked' : ''}/>
            <span class="val">${spec.default}</span>`;
          const [input, out] = [row.querySelector('input'), row.querySelector('.val')];
          input.onchange = () => { options[key] = input.checked; out.textContent = input.checked; render(); };
        }
        else if (numeric) {
          row.innerHTML = `<label>${key}</label>
            <input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${spec.default}"/>
            <span class="val">${spec.default}</span>`;
          const [input, out] = [row.querySelector('input'), row.querySelector('.val')];
          input.oninput = () => { options[key] = Number(input.value); out.textContent = input.value; render(); };
        }
        else {
          row.innerHTML = `<label>${key}</label><input type="text" value="${spec.default}"/>`;
          const input = row.querySelector('input');
          input.oninput = () => { options[key] = input.value; render(); };
        }
        els.controls.appendChild(row);
      }
  }
