"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  SearchInput,
  Switch,
  PasswordInput,
  Select,
  Spinner,
  Skeleton,
  Tabs,
  Title,
  TextInput,
} from "@/components/ui";

export default function DesignSystemPreview() {
  const [switchState, setSwitchState] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="bg-surface text-text min-h-screen pb-24 font-sans">
      <main className="flex flex-col gap-10 px-4 py-8">
        {/* ESSENTIAL */}
        <section>
          <Title label="Essential" className="mb-4" size="h1" />

          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Buttons (Variants)</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="inverse">Inverse</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <h3 className="mt-4 mb-3 text-lg font-medium">
                Buttons (Sizes) Medium
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Inputs</h3>
              <div className="flex max-w-sm flex-col gap-4">
                <TextInput label="Text Input" placeholder="ENTREZ DU TEXT..." />
                <TextInput
                  label="With Error"
                  placeholder="ENTREZ DU TEXT..."
                  error="Ce champ est requis."
                />
                <PasswordInput
                  label="Password Input"
                  placeholder="Mot de passe"
                />
                <Select label="Select">
                  <option value="">Sélectionnez une option</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                </Select>
                <SearchInput placeholder="Rechercher..." />
              </div>
            </div>

            {/* Switch */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Switch</h3>
              <div className="flex flex-wrap gap-4">
                <Switch
                  label="Active"
                  checked={switchState}
                  onChange={(e) => setSwitchState(e.target.checked)}
                />
                <Switch
                  label="Inactive"
                  checked={!switchState}
                  onChange={(e) => setSwitchState(!e.target.checked)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* STRUCTURE */}
        <section>
          <Title label="Structure" className="mb-4" size="h2" />

          <div className="space-y-6">
            {/* Cards */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Cards (Paddings)</h3>
              <div className="flex flex-col gap-6">
                <Card padding="none">
                  <div>No padding (Custom Content)</div>
                </Card>
                <Card padding="sm" cardTitle="Small padding">
                  lorem ipsus
                </Card>
                <Card padding="md" cardTitle="Medium padding (default)">
                  lorem ipsus
                </Card>
                <Card padding="lg" cardTitle="Large padding">
                  lorem ipsus
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        <section>
          <Title label="Feedback" className="mb-4" size="h3" />

          <div className="space-y-6">
            {/* Events Colors */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Event Colors</h3>
              <div className="flex flex-col gap-3">
                <div className="bg-error text-on-error border-error rounded border p-4">
                  Error: Something went wrong.
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Spinner</h3>
              <div className="flex items-center gap-4">
                <Spinner />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold">Skeleton</h3>
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION */}
        <section>
          <Title label="Navigation (Preview)" className="mb-4" size="h4" />
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-semibold">Tabs</h3>
              <Tabs
                tabs={["Vue 1", "Vue 2", "Vue 3"]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <div className="bg-surface-sunken mt-2 rounded-lg p-4">
                Contenu de la{" "}
                {activeTab === 0
                  ? "Vue 1"
                  : activeTab === 1
                    ? "Vue 2"
                    : "Vue 3"}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Tabs
        tabs={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
          { name: "Contact", href: "/contact" },
        ]}
        layoutId="inlineMenuActiveTab"
      />
    </div>
  );
}
