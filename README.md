# Chen Code Editor

Chen Code Editor is a custom React/Vite application for creating Entity-Relationship (ER) diagrams using Chen Notation. It parses a simple text-based domain-specific language (DSL) called **Chen Code** and dynamically calculates a force-directed layout to render interactive SVG diagrams. 

It features a manual text editor, real-time syntax checking, interactive pan and zoom canvas, a documentation page, and an AI generation system (powered by Google Gemini) that converts natural language database requirements or sketched diagrams (images) directly into Chen Code.

---

## Key Features

1. **Manual ER Canvas**: A dual-pane workspace where users can type Chen Code DSL and view the rendered interactive SVG in real-time.
2. **Interactive Canvas**: Drag to pan around the canvas; scroll to zoom in/out. Includes a canvas viewport reset.
3. **Strict Validation**: Live compiler showing line-by-line syntax errors in the footer.
4. **Google Authentication**: Seamless user log-in via Firebase Google Auth provider. Manual editor is public, but AI generation requires sign-in.
5. **AI Text Generation**: Provide natural language requirements (e.g., "Students register for courses"), and Gemini produces valid Chen Code.
6. **AI Image Generation**: Upload a diagram sketch, and Gemini reads it to output Chen Code DSL.
7. **Strict Sanitization**: Automatic stripping of markdown fences or explanations from the AI response.
8. **Real-time AI Verification**: The generated code is verified in the AI panel before insertion, allowing users to edit and repair issues on the spot.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, React Router DOM, Tailwind CSS v4, Firebase Client SDK
- **Backend (API Proxy)**: Node/Express, Firebase Admin SDK (token verification), Google Gen AI SDK
- **Physics Engine**: Force-directed layout generator utilizing Hooke's Law (springs) and Coulomb's Law (electrostatic repulsion)

---

## Chen Code Syntax Specification

The custom renderer supports the following grammar rules:

1. **Entity**:
   ```txt
   entity Employee
   ```
2. **Weak Entity**:
   ```txt
   weak_entity Dependent
   ```
3. **Attribute**:
   ```txt
   attr Employee EmpID PK      // PK: Primary Key (underlined)
   attr Employee Phone MV      // MV: Multivalued (double oval)
   attr Employee Age DER       // DER: Derived (dashed oval)
   ```
4. **Composite Attribute**:
   ```txt
   attr Employee Name
   attr Name FirstName
   attr Name LastName
   ```
5. **Relationship**:
   ```txt
   rel Department 1 Employs M Employee PARTIAL TOTAL
   // Format: rel [E1] [Card1] [Name] [Card2] [E2] [Tot1] [Tot2]
   // Total values: TOTAL (double-lines) or PARTIAL (single-lines)
   // Cardinality values: 1, M, N, or _
   ```
6. **Identifying Relationship**:
   ```txt
   ident_rel Employee 1 Has N Dependent PARTIAL TOTAL
   // Connecting weak entities to their identifying owners. Renders double diamonds.
   ```
7. **Generalization / Specialization (ISA)**:
   ```txt
   isa Account Savings Checking
   // Renders a triangle marked 'ISA' pointing children to their parent entity.
   ```
8. **Comments**:
   ```txt
   // Any line starting with double slashes is ignored by the parser.
   ```

### Strict Syntax Rules
- All entities/weak entities **must** be declared before referencing them in attributes, relationships, or generalization structures.
- Names of entities, attributes, and relationships must not contain spaces. Use CamelCase or underscores (e.g., `EmployeeRecord`, `emp_id`).

---

## Local Setup & Configuration

This project contains a React client app and a Node/Express backend API server. To keep the Gemini API key secret, the client communicates with the local proxy backend which validates requests before invoking Gemini.

### 1. Environment Variables Config

Create a `.env` file in the root directory and copy the contents from `.env.example`:

```bash
# Firebase Client Config (React app)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=chen-editor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chen-editor
VITE_FIREBASE_STORAGE_BUCKET=chen-editor.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567:web:abcd...

# Gemini API Config (Backend app)
GEMINI_API_KEY=AIzaSy...
```

### 2. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Under **Authentication**, enable **Google** sign-in provider.
3. Add `localhost` to the authorized domains in your Firebase authentication console (e.g., under Settings > Authorized Domains).
4. Register a Web Application inside your project, and paste the configuration keys into the `.env` file under the client variables block.

### 3. Google Gemini Setup

1. Head to [Google AI Studio](https://aistudio.google.com/) and create a free API Key.
2. Add your key to `GEMINI_API_KEY` in the `.env` file.

---

## How to Run Locally

Install the dependencies and run the client and backend concurrent dev servers:

```bash
# Install root (client) packages
pnpm install

# Install server (backend) packages
pnpm install --prefix server

# Start both Vite client and Express server concurrently
pnpm run dev:all
```

Alternatively, you can run them in separate terminals:

```bash
# Terminal 1: Run Vite Client (default: http://localhost:5173)
pnpm run dev

# Terminal 2: Run Express Backend API (default: http://localhost:3001)
pnpm run server
```

The dev server proxy settings in `vite.config.js` will automatically redirect `/api` frontend calls to the backend on `http://localhost:3001`.

---

## Production Build

To compile and build the static assets for production deployment:

```bash
pnpm run build
```
