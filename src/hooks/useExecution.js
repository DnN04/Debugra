import { useState, useCallback } from 'react';
import { useCallback as useReactCallback } from 'react';
import toast from 'react-hot-toast';
import { executeCode } from '../services/api';
import { LANGUAGES } from '../utils/languageConfig';
import { EXEC_STATUS, OUTPUT_TABS } from '../config/constants';

/**
 * useExecution
 * Encapsulates all logic for running code against the Wandbox API.
 *
 * @param {string} language - the current language key (e.g. 'python')
 * @param {string} code     - the current editor code
 * @param {string} stdin    - user-supplied stdin string
 * @param {boolean} isMobile
 * @param {Function} setMobileTab - to switch mobile tab to output on run
 */
export function useExecution({ language, code, stdin, isMobile, setMobileTab }) {
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [execStatus, setExecStatus] = useState(EXEC_STATUS.IDLE);
  const [execTime, setExecTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState(OUTPUT_TABS.STDOUT);

  const run = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveOutputTab(OUTPUT_TABS.STDOUT);
    if (isMobile) setMobileTab?.('output');
    setExecStatus(EXEC_STATUS.RUNNING);
    setStdout('');
    setStderr('');
    setExecTime(null);

    const startTime = performance.now();
    try {
      const langConfig = LANGUAGES[language];
      const result = await executeCode(code, langConfig.id, stdin);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setExecTime(elapsed + 's');
      setStdout(result.stdout || '(No output)');
      setStderr(result.stderr || '');

      if (result.status?.id === 3) {
        setExecStatus(EXEC_STATUS.SUCCESS);
      } else {
        setExecStatus({ type: 'error', text: result.status?.description || 'Error' });
        if (result.stderr) setActiveOutputTab(OUTPUT_TABS.STDERR);
      }
    } catch (err) {
      setStderr(err.message || 'Execution failed');
      setExecStatus(EXEC_STATUS.FAILED);
      setActiveOutputTab(OUTPUT_TABS.STDERR);
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning, stdin, isMobile, setMobileTab]);

  const clear = useCallback(() => {
    setStdout('');
    setStderr('');
    setExecStatus(EXEC_STATUS.IDLE);
    setExecTime(null);
    setActiveOutputTab(OUTPUT_TABS.STDOUT);
  }, []);

  return {
    stdout,
    stderr,
    execStatus,
    execTime,
    isRunning,
    activeOutputTab,
    setActiveOutputTab,
    run,
    clear,
  };
}
