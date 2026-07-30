import aufbau, { html } from '@aufbau/kit';
    //import { importFile } from '@aufbau/import';

    // 1. Footer Component & Theme Swapper (Bestehende Logik)
    function FooterNav () {
      return html`<div>moin!</div>`;
    }
    aufbau.render(html`<${FooterNav} />`, document.querySelector('footer div'));

    const { define, update, signal, effect } = aufbau;

    define({ key: 'bg', type: 'property' });
    define({ key: 'fg', type: 'property' });

    const colors = [
      { bg: 'white', fg: 'black' },
      { bg: 'red',   fg: 'black' },
      { bg: 'red',   fg: 'white' },
      { bg: 'black', fg: 'white' },
      { bg: 'black', fg: 'red'   },
      { bg: 'white', fg: 'red'   },
    ];

    const indexSignal = signal(0);

    effect(() => {
      const { bg, fg } = colors[indexSignal.value];
      update({ key: 'bg', value: bg });
      update({ key: 'fg', value: fg });
    });

    // 2. @aufbau/import Test Suite
    const jsonState = signal(null);
    const   mdState = signal('Lade Markdown...');
    const   tsState = signal('Lade TypeScript...');

    async function runImportTests() {
      try {
        // A) Test test.jsonc
        const jsonData = await aufbau.import('./index.jsonc');
        jsonState.value = jsonData;

        // B) Test test.md
        const mdHtml = await aufbau.import('./readme.md');
        mdState.value = mdHtml;

        // C) Test test.ts
        //const tsModule = await aufbau.import('./test/test.ts');
        //const service  = new tsModule.TestService('Aufbau Kit');
        //tsState.value = service.getGreeting(tsModule.defaultUser);
      } catch (err) {
        console.error('[Import Test Error]:', err);
      }
    }

    runImportTests();

    function ImportTestComponent() {
      return html`
        <div style="max-width: 800px; margin: 2rem auto; padding: 1.5rem; border: 2px dashed currentcolor; border-radius: 12px; font-family: 'Hubot Sans', sans-serif;">
          <h2 style="margin-top: 0;">🧪 @aufbau/import Test Results</h2>

          <section style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #007acc;">1. TypeScript Module (.ts)</h3>
            <p style="font-size: 1.1rem;"><strong>${tsState}</strong></p>
          </section>

          <section style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #d19a66;">2. JSONC Data (.jsonc)</h3>
            <pre style="background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; overflow-x: auto;">
${JSON.stringify(jsonState.value, null, 2)}
            </pre>
          </section>

          <section style="background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #42b983;">3. Rendered Markdown (.md)</h3>
            <div dangerouslySetInnerHTML=${{ __html: mdState.value }}></div>
          </section>
        </div>
      `;
    }

    aufbau.render(html`<${ImportTestComponent} />`, document.querySelector('#import-test-container'));
