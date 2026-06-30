import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import ChenCodeEditor from "../components/ChenCodeEditor";
import ChenCanvas from "../components/ChenCanvas";
import AiGeneratePanel from "../components/AiGeneratePanel";
import AuthButton from "../components/AuthButton";
import { parseChenCode, DEFAULT_CODE } from "../lib/chenParser";
import { calculateLayout } from "../lib/chenLayout";
import { useDebounce } from "../hooks/useDebounce";

export default function EditorPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize Dark Mode state from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Sync Dark Mode state to document root and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Track window size for responsive PanelGroup direction
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce the code by 400ms to heavily optimize browser AST processing
  const debouncedCode = useDebounce(code, 400);

  // Sync parse and layout updates when debounced code changes
  const layout = useMemo(() => {
    const { nodes, links, errors } = parseChenCode(debouncedCode);
    if (errors.length === 0) {
      const { positionedNodes, positionedLinks } = calculateLayout(
        nodes,
        links,
        800,
        600,
      );
      return { nodes: positionedNodes, links: positionedLinks, errors: [] };
    } else {
      return { nodes: [], links: [], errors };
    }
  }, [debouncedCode]);

  const handleInsertCode = (newCode) => {
    setCode(newCode);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      {/* HEADER CONTROLS */}
      <header className="px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-end items-center z-20 shadow-sm transition-colors duration-300">
        <div className="flex-1">
          <Link
            to="/"
            className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
          >
            aftababu.dev
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobile(!isMobile)}
            className="text-lg outline-none border-none cursor-pointer"
          >
            {isMobile ? "📳" : "🖳"}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-lg p-1 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <Link
            to="/how-to-use"
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            How to Use & AI Prompt
          </Link>
          <AuthButton />
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main
        className={`flex-1 ${isMobile ? "overflow-auto" : "overflow-hidden"}   relative `}
      >
        <PanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          className={` ${isMobile && "!grid !grid-cols-[1fr] !grid-rows-[1fr_auto_1fr] !h-[195%]"} w-full`}
        >
          <Panel
            defaultSize={400}
            minSize={300}
            maxSize={700}
            className="z-10 bg-white dark:bg-slate-900 transition-colors duration-300"
          >
            <ChenCodeEditor
              code={code}
              setCode={setCode}
              errors={layout.errors}
              onOpenAiPanel={() => setIsAiOpen(true)}
            />
          </Panel>
          <PanelResizeHandle
            className={`bg-slate-200 dark:bg-slate-800 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors duration-150 active:bg-blue-500 ${
              isMobile
                ? "h-1.5 w-full bg-slate-200 dark:bg-slate-800 cursor-row-resize"
                : "w-1.5 h-full cursor-col-resize"
            }`}
          />
          <Panel minSize={30}>
            <ChenCanvas layout={layout} />
          </Panel>
        </PanelGroup>
      </main>

      {/* AI GENERATION SYSTEM */}
      <AiGeneratePanel
        key={isAiOpen}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onInsertCode={handleInsertCode}
      />
    </div>
  );
}
