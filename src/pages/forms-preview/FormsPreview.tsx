import { Component, createSignal } from "solid-js";
import Input from "../../components/forms/Input";

const FormsPreview: Component = () => {
  const [textValue, setTextValue] = createSignal("");
  const [emailValue, setEmailValue] = createSignal("");
  const [passwordValue, setPasswordValue] = createSignal("");
  const [numberValue, setNumberValue] = createSignal("");
  const [searchValue, setSearchValue] = createSignal("");
  const [dateValue, setDateValue] = createSignal("");

  return (
    <div class="min-h-screen bg-stage p-8">
      <div class="mx-auto max-w-4xl">
        <h1 class="mb-2 text-3xl font-bold text-ink">Form Components Preview</h1>
        <p class="mb-8 text-muted">Test and preview all form components in one place.</p>

        {/* Input Component */}
        <section class="stage-card mb-12 rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-6 text-xl font-semibold text-ink">Input Component</h2>

          <div class="grid gap-6 md:grid-cols-2">
            {/* Basic Text Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Basic Text Input</h3>
              <Input
                type="text"
                label="Username"
                placeholder="Enter your username"
                value={textValue()}
                onInput={(e) => setTextValue(e.currentTarget.value)}
              />
            </div>

            {/* Email Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Email Input</h3>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={emailValue()}
                onInput={(e) => setEmailValue(e.currentTarget.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Password Input</h3>
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={passwordValue()}
                onInput={(e) => setPasswordValue(e.currentTarget.value)}
              />
            </div>

            {/* Number Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Number Input</h3>
              <Input
                type="number"
                label="Age"
                placeholder="25"
                min={0}
                max={120}
                maxLength={3}
                value={numberValue()}
                onInput={(e) => setNumberValue(e.currentTarget.value)}
              />
            </div>

            {/* Search Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Search Input</h3>
              <Input
                type="search"
                label="Search"
                placeholder="Search for something..."
                value={searchValue()}
                onInput={(e) => setSearchValue(e.currentTarget.value)}
              />
            </div>

            {/* Date Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Date Input</h3>
              <Input
                type="date"
                label="Birth Date"
                value={dateValue()}
                onInput={(e) => setDateValue(e.currentTarget.value)}
              />
            </div>

            {/* Required Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Required Input</h3>
              <Input type="text" label="Full Name" placeholder="John Doe" required />
            </div>

            {/* Input with Helper Text */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">With Helper Text</h3>
              <Input
                type="text"
                label="Website"
                placeholder="https://example.com"
                helperText="Enter the full URL including https://"
              />
            </div>

            {/* Input with Error */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">With Error State</h3>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value="invalid-email"
                error="Please enter a valid email address"
              />
            </div>

            {/* Disabled Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Disabled Input</h3>
              <Input type="text" label="Disabled Field" value="Cannot edit this" disabled />
            </div>

            {/* Read-only Input */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">Read-only Input</h3>
              <Input type="text" label="Read-only Field" value="Read-only value" readonly />
            </div>

            {/* Input with min/max length */}
            <div>
              <h3 class="mb-3 text-sm font-medium text-muted">With Min/Max Length</h3>
              <Input
                type="text"
                label="Username"
                placeholder="3-20 characters"
                minLength={3}
                maxLength={20}
                helperText="Must be between 3 and 20 characters"
              />
            </div>
          </div>
        </section>

        {/* Current Values */}
        <section class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 text-xl font-semibold text-ink">Current Values</h2>
          <div class="rounded-lg border border-line bg-surface-2 p-4 font-mono text-sm">
            <pre class="text-ink">
              {JSON.stringify(
                {
                  text: textValue(),
                  email: emailValue(),
                  password: passwordValue(),
                  number: numberValue(),
                  search: searchValue(),
                  date: dateValue(),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </section>

        {/* Placeholder for future components */}
        <section class="mt-8 rounded-xl border border-dashed border-line p-8 text-center">
          <p class="text-muted">
            More form components will be added here: Select, Checkbox, Radio, Textarea, Switch, etc.
          </p>
        </section>
      </div>
    </div>
  );
};

export default FormsPreview;
