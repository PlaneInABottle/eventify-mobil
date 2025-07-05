# Claude Development Guidelines for Eventify Project

## 🚀 Essential MCP Tools Available

### **Maestro MCP - Mobile Testing (PRIMARY TOOL)**
The most powerful tool for React Native/mobile app testing. **Use this extensively!**

#### **🎯 Key Commands:**
```bash
# View hierarchy (ALWAYS use instead of screenshots!)
mcp__maestro__inspect_view_hierarchy

# Device management
mcp__maestro__list_devices
mcp__maestro__take_screenshot  # Only when visuals needed
mcp__maestro__tap_on
mcp__maestro__run_flow_files

# Navigation
mcp__maestro__back
mcp__maestro__input_text
```

#### **💡 Best Practices:**
- **ALWAYS use `inspect_view_hierarchy` first** - It's like Playwright's element inspector
- **DON'T take screenshots for debugging** - Use hierarchy inspection instead
- **Chain tests without app restarts** - Much faster development
- **Use text selectors over coordinates** - More reliable

### **Supabase MCP - Database Operations**
Direct database access and management.

```bash
mcp__supabase__list_tables
mcp__supabase__execute_sql
mcp__supabase__get_advisors
mcp__supabase__list_edge_functions
```

### **Context7 MCP - Documentation Access**
Get up-to-date documentation for any library.

```bash
mcp__context7__resolve_library_id libraryName="maestro"
mcp__context7__get_library_docs
```

## 🧠 Use Gemini for Large Context Analysis

**When to use Gemini CLI:**
- Analyzing large codebases
- Understanding complex file structures  
- Getting broad architectural overviews
- Summarizing multiple files at once

```bash
# Quick analysis commands
gemini -p "analyze this codebase structure" -m "gemini-2.5-flash"
gemini -p "explain this complex function" -m "gemini-2.5-flash" 
gemini -p "summarize the project goals and architecture" -m "gemini-2.5-pro"
gemini -p "@. Review entire codebase for potential issues" -m "gemini-2.5-pro"
```

**Gemini CLI Flags:**
- `-p, --prompt`: Direct prompt (non-interactive)
- `-m, --model`: Specify model (gemini-2.5-flash, gemini-2.5-pro)
- `-s, --sandbox`: Safe execution mode
- `--yolo`: Auto-approve all tool calls

## 📱 Mobile Testing Workflow

### **DON'T DO THIS (Slow & Inefficient):**
```yaml
# ❌ Taking screenshots for every step
- takeScreenshot: "step1.png"
- tapOn: "Button"
- takeScreenshot: "step2.png"
- assertVisible: "Something"
- takeScreenshot: "step3.png"
```

### **DO THIS (Fast & Precise):**
```yaml
# ✅ Use hierarchy inspection once, then target elements
appId: com.eventify.app
---
# Run: mcp__maestro__inspect_view_hierarchy first to see structure

# Then use precise selectors
- assertVisible: "MAP"
- tapOn: "LIST"  
- waitForAnimationToEnd
- assertVisible: "Chats"
- tapOn:
    point: "50%,80%"  # When needed
```

## 🔄 Development Iteration Pattern

1. **Start with hierarchy inspection:**
   ```bash
   mcp__maestro__inspect_view_hierarchy device_id="RF8N923HF9V"
   ```

2. **Create focused tests:**
   ```yaml
   # Small, targeted tests in .maestro/ folder
   # Chain multiple tests without app restart
   ```

3. **Use Gemini for complex analysis:**
   ```bash
   gemini -p "analyze this test suite structure and suggest improvements" -m "gemini-2.5-flash"
   ```

4. **Iterate quickly:**
   ```bash
   mcp__maestro__run_flow_files device_id="RF8N923HF9V" flow_files=".maestro/test.yaml"
   ```

## 🎯 Current Project Context

### **Device Info:**
- **Samsung Galaxy M51** (RF8N923HF9V)
- **App:** com.eventify.app (React Native + Expo)
- **State:** Running, user NOT logged in

### **App Structure Discovered:**
```yaml
Top Navigation: MAP, LIST, CAMPAIGNS
Bottom Navigation: Events, Chats, Inventory, Profile
Map Elements: "Search This Area" button, Google Maps
Floating Buttons: Coordinates [954,1555], [954,1828]
```

### **Working Tests:**
- `.maestro/hierarchy-exploration.yaml` ✅ (33 commands)
- `.maestro/quick-navigation-test.yaml` ✅ (11 commands)

## 🚨 Common Mistakes to Avoid

### **1. Screenshot Overuse**
**Wrong:** Taking screenshots for debugging
**Right:** Use `inspect_view_hierarchy` - it's faster and more informative

### **2. App Restart Overhead** 
**Wrong:** `launchApp` with `clearState: true` every test
**Right:** Chain tests, use `clearState: false` or omit entirely

### **3. Poor Element Selection**
**Wrong:** Using coordinates for everything
**Right:** Use text selectors, accessibility labels, then coordinates as last resort

### **4. Not Using Available MCPs**
**Wrong:** Manual database queries, manual documentation lookup
**Right:** Use Supabase MCP, Context7 MCP for direct access

## 📋 Session Continuity

**Always read:** `CURRENT_SESSION.md` - Contains current app state, working tests, discovered elements

**Before starting work:**
1. Read `CURRENT_SESSION.md`
2. Check device status: `mcp__maestro__list_devices`
3. Inspect current app state: `mcp__maestro__inspect_view_hierarchy`
4. Use Gemini for complex analysis when needed

## 🧪 Testing Philosophy

**React Native + Maestro = Perfect Match**
- Maestro understands React Native component hierarchy
- No need for complex selectors like web testing
- Text-based selection works reliably
- Real device testing > simulators

**Development Speed Priority:**
1. Use hierarchy inspection (instant)
2. Create small, focused tests (fast feedback)
3. Chain tests without restart (efficiency)
4. Use Gemini for heavy analysis (offload complexity)

---

**Remember:** The goal is fast, reliable testing during development. Use the right tool for each task:
- **Maestro MCP:** Mobile interaction & testing
- **Gemini CLI:** Large context analysis  
- **Supabase MCP:** Database operations
- **Context7 MCP:** Documentation lookup

**Key insight:** `inspect_view_hierarchy` replaced all screenshot-based debugging and made testing 10x faster!