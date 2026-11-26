import React, { useEffect, useState } from 'react';
import { Award, Play, RotateCcw } from 'lucide-react';
import { PLAYGROUND_PRESETS } from '../data/curriculum';
import { TopicId } from '../types/learning';
import { PythonRunResult, runPythonCode } from '../utils/pythonRunner';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface PlaygroundModeProps {
  topic: TopicId;
  initialCode?: string | null;
  onClearInitialCode?: () => void;
  onCompleteProject?: (projectTitle: string, code: string) => void;
}

export const PlaygroundMode: React.FC<PlaygroundModeProps> = ({
  topic,
  initialCode,
  onClearInitialCode,
  onCompleteProject,
}) => {
  const presets = PLAYGROUND_PRESETS[topic];
  const [activePresetId, setActivePresetId] = useState(presets[0].id);
  const [code, setCode] = useState(initialCode ?? presets[0].code);
  const [result, setResult] = useState<PythonRunResult>(() =>
    runPythonCode(initialCode ?? presets[0].code)
  );

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setResult(runPythonCode(initialCode));
      onClearInitialCode?.();
    } else {
      const first = PLAYGROUND_PRESETS[topic][0];
      setActivePresetId(first.id);
      setCode(first.code);
      setResult(runPythonCode(first.code));
    }
  }, [topic, initialCode, onClearInitialCode]);

  const handleRun = () => {
    setResult(runPythonCode(code));
  };

  const handleCompleteProject = () => {
    const res = runPythonCode(code);
    setResult(res);
    if (!res.error && code.trim()) {
      const currentPreset = presets.find((p) => p.id === activePresetId);
      const title = currentPreset ? currentPreset.title : 'Custom Python Project';
      onCompleteProject?.(title, code);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(found.id);
    setCode(found.code);
    setResult(runPythonCode(found.code));
  };

  const handleReset = () => {
    const found = presets.find((p) => p.id === activePresetId) ?? presets[0];
    setCode(found.code);
    setResult(runPythonCode(found.code));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = `${code.slice(0, start)}    ${code.slice(end)}`;
      setCode(next);
      window.requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Preset Selector — Indigo-Gold Swirling Fire */}
      <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-3 shadow-[0_12px_28px_rgba(59,130,246,0.18)] text-white">
        <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <span className="px-2 text-xs font-bold text-[#BAE6FD]">Starter scripts:</span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                activePresetId === preset.id
                  ? 'bg-white text-[#191944] shadow-sm'
                  : 'border border-white/15 bg-black/35 text-white/90 hover:border-[#7DD3FC] hover:text-white'
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>

        <span className="relative z-10 px-2 text-xs text-[#CBD5E1]">
          Tip: Press{' '}
          <kbd className="rounded bg-black/45 border border-white/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#FDE047]">
            Ctrl/Cmd + Enter
          </kbd>{' '}
          to run
        </span>
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 2. Left Zone: Interactive Python Editor — Violet Swirling Fire */}
        <div className="relative overflow-hidden lg:col-span-7 flex flex-col rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-5 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-4">
          <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.36]" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Python Editor</h2>
              <p className="text-xs text-[#DDD6FE]">
                Modify variables, list operations, loops, or print statements.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-xs font-semibold text-white hover:border-[#C4B5FD] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleRun}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Run Code</span>
              </button>
              <button
                type="button"
                onClick={handleCompleteProject}
                disabled={!code.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#19BCA9] to-[#40DDEB] px-4 py-2 text-xs font-extrabold text-[#0B2E2B] shadow-sm disabled:opacity-45 hover:brightness-110 transition-all"
              >
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Complete Project (+20 pts)</span>
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            rows={14}
            aria-label="Python code editor"
            className="relative z-10 code-editor w-full flex-1 rounded-2xl border border-white/20 bg-[#140E26]/95 p-4 font-mono text-[13px] leading-relaxed text-[#C7F9EC] focus:border-[#A78BFA] focus:outline-none resize-y"
          />
        </div>

        {/* Right Zone: Console Output & Live Variable Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* 3. Console Output — Emerald-Cyan Swirling Fire */}
          <div className="relative overflow-hidden rounded-[24px] border border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42] p-5 shadow-[0_14px_34px_rgba(16,185,129,0.2)] text-white space-y-3">
            <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.38]" />
            <h2 className="relative z-10 text-base font-extrabold text-white">Console Output</h2>
            <div className="relative z-10 min-h-[150px] rounded-2xl border border-white/15 bg-black/60 p-4 font-mono text-[13px] leading-relaxed backdrop-blur-xs">
              {result.error ? (
                <pre className="whitespace-pre-wrap text-[#FF9EAA]">{result.error}</pre>
              ) : result.output.length > 0 ? (
                <pre className="whitespace-pre-wrap text-[#6EE7B7]">
                  {result.output.join('\n')}
                </pre>
              ) : (
                <p className="text-[#9E95B8]">No output printed. Call print(...) to display values.</p>
              )}
            </div>
          </div>

          {/* 4. Live Variable & Type Inspector — Blue-Cyan Swirling Fire */}
          <div className="relative overflow-hidden flex-1 rounded-[24px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0B254B] to-[#082B36] p-5 shadow-[0_14px_34px_rgba(14,165,233,0.2)] text-white space-y-3">
            <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.40]" />
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Variable Inspector</h2>
              <span className="font-mono text-xs font-bold text-[#67E8F9] tabular-nums">
                {result.variables.length} defined
              </span>
            </div>

            {result.variables.length === 0 ? (
              <p className="relative z-10 text-xs text-[#BAE6FD]">
                Assign variables in the editor to inspect their live values and Python types.
              </p>
            ) : (
              <div className="relative z-10 overflow-x-auto rounded-2xl border border-white/15 bg-black/45 px-3 py-1 backdrop-blur-xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-[#7DD3FC]">
                      <th className="py-2 pr-3 font-bold">Name</th>
                      <th className="py-2 pr-3 font-bold">Type</th>
                      <th className="py-2 font-bold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {result.variables.map((v) => (
                      <tr key={v.name}>
                        <td className="py-2.5 pr-3 text-white font-bold">{v.name}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#5EEAD4]">{v.typeName}</td>
                        <td className="py-2.5 text-[#E2E8F0] break-all">{v.repr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

