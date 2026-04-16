import React, { useState } from "react";
import { Link } from "react-router-dom";

// The exact raw text that gets copied to the clipboard for the AI to read.
const AI_PROMPT_TEXT = `You are an expert database architect. I am using a custom ER Diagram renderer called "Chen Code Editor".
Please generate "Chen Code" for my database requirements using EXACTLY the syntax below.
Do not use markdown formatting inside the code block, and do not use spaces in entity/attribute names (use CamelCase or underscores).

--- CHEN CODE SYNTAX GUIDE ---
1. Entities:
   Syntax: \`entity [Name]\`
   Example: \`entity Employee\`

2. Weak Entities:
   Syntax: \`weak_entity [Name]\`
   Example: \`weak_entity Dependent\`

3. Attributes:
   Syntax: \`attr [ParentName] [AttrName] [Flags]\`
   Flags (Optional): PK (Primary Key), MV (Multi-valued), DER (Derived).
   Example: \`attr Employee EmpID PK\`
   Example: \`attr Employee Phone MV\`

4. Composite Attributes:
   Syntax: \`attr [ParentAttrName] [ChildAttrName]\`
   Example: \`attr Name FirstName\`

5. Relationships:
   Syntax: \`rel [Entity1] [Card1] [RelName] [Card2] [Entity2] [Total1] [Total2]\`
   Cards: 1, M, N, or _ (for none).
   Totals: TOTAL or PARTIAL.
   Example: \`rel Department 1 Employs M Employee PARTIAL TOTAL\`

6. Identifying Relationships:
   Syntax: \`ident_rel [Entity1] [Card1] [RelName] [Card2] [WeakEntity] [Total1] [Total2]\`
   Example: \`ident_rel Employee 1 Has N Dependent PARTIAL TOTAL\`

7. Generalization / Specialization (ISA):
   Syntax: \`isa [ParentEntity] [Child1] [Child2] ...\`
   Example: \`isa Account Savings Current\`

--- RULES ---
- Declare entities BEFORE attaching attributes or using them in relationships.
- Use \`//\` for comments.

Please generate the Chen Code for the following scenario:
[INSERT YOUR SCENARIO HERE]`;

export default function Documentation() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <Link to="/" className="text-sm text-blue-400 hover:underline">
          &larr; Back to Editor
        </Link>
        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">
              Chen Code Editor Docs
            </h1>
            <p className="text-slate-300">
              The official guide and AI-prompt generator for your ER diagrams.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
              copied
                ? "bg-green-500 text-white shadow-green-500/50"
                : "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/50"
            } shadow-lg`}
          >
            {copied ? (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>{" "}
                Copied to Clipboard!
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>{" "}
                Copy AI Prompt
              </>
            )}
          </button>
        </div>

        {/* HOW TO USE SECTION */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 flex items-center justify-center rounded-full text-sm">
              💡
            </span>
            How to Use with AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white">
                1
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">
                Copy the Prompt
              </h3>
              <p className="text-slate-600 text-sm">
                Click the blue button at the top of this page to copy the strict
                syntax instructions to your clipboard.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white">
                2
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">
                Paste in ChatGPT
              </h3>
              <p className="text-slate-600 text-sm">
                Paste the copied text into ChatGPT, Gemini, or Claude. Replace{" "}
                <code>[INSERT YOUR SCENARIO HERE]</code> with your homework
                question or database requirements.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white">
                3
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">
                Render Diagram
              </h3>
              <p className="text-slate-600 text-sm">
                Take the code generated by the AI and paste it directly into the
                left panel of the <strong>Chen Code Editor Canvas</strong> to
                instantly visualize it.
              </p>
            </div>
          </div>
        </div>

        {/* SYNTAX REFERENCE */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold">Manual Syntax Reference</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-700 mb-2 border-l-4 border-blue-500 pl-3">
                Entities & Attributes
              </h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`entity Student
weak_entity Guardian

attr Student StudentID PK
attr Student Phone MV
attr Student Age DER

// Composite Attribute
attr Student Name
attr Name FirstName
attr Name LastName`}
                </code>
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 mb-2 border-l-4 border-purple-500 pl-3">
                Relationships (with Cardinality & Participation)
              </h4>
              <p className="text-sm text-slate-500 mb-2">
                Format:{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-800">
                  rel [E1] [Card1] [Name] [Card2] [E2] [Tot1] [Tot2]
                </code>
              </p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`// 1:M Relationship (Department to Employees)
rel Department 1 Employs M Employee TOTAL PARTIAL

// Identifying Relationship (Employee to Weak Entity Dependent)
ident_rel Employee 1 Has N Dependent PARTIAL TOTAL`}
                </code>
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 mb-2 border-l-4 border-rose-500 pl-3">
                Generalization (ISA)
              </h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`entity Account
entity Savings
entity Checking

isa Account Savings Checking`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
