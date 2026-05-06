"use client";

import React, { useState } from "react";
import { InlineMenu } from "../package/UI/InlineMenu";
import { Card } from "../package/UI/Card";
import { Button } from "../package/UI/Button";
import { SearchInput } from "../package/UI/SearchInput";
import { Switch } from "../package/UI/Switch";
import { TextInput } from "../package/UI/TextInput";
import { PasswordInput } from "../package/UI/PasswordInput";
import { Select } from "../package/UI/Select";
import { Spinner } from "../package/UI/Spinner";
import { Skeleton } from "../package/UI/Skeleton";
import { Tabs } from "../package/UI/Tabs";
import { Title } from "../package/UI/Title";

export default function DesignSystem() {
  const [switchState, setSwitchState] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-surface pb-24 font-sans text-text">
      <main className="px-4 py-8 flex flex-col gap-10">
        {/* ESSENTIAL */}
        <section>
          <Title label="Essential" className="mb-4" size="h1" />

          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Buttons (Variants)</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="inverse">Inverse</Button>
                <Button variant="neutral">Neutral</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <h3 className="text-lg font-medium mb-3 mt-4">
                Buttons (Sizes) Medium
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Inputs</h3>
              <div className="flex flex-col gap-4 max-w-sm">
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
              <h3 className="text-lg font-semibold mb-3">Switch</h3>
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
              <h3 className="text-lg font-semibold mb-3">Cards (Paddings)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="none">
                  <div className="p-4 bg-primary text-primary-text">
                    No padding (Custom Content)
                  </div>
                </Card>
                <Card padding="sm">Small padding</Card>
                <Card padding="md">Medium padding (default)</Card>
                <Card padding="lg">Large padding</Card>
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
              <h3 className="text-lg font-semibold mb-3">Event Colors</h3>
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded border bg-secondary text-on-secondary border-secondary">
                  Info: This is an information message.
                </div>
                <div className="p-4 rounded border bg-error text-on-error border-error">
                  Error: Something went wrong.
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Spinner</h3>
              <div className="flex gap-4 items-center">
                <Spinner />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Skeleton</h3>
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
              <h3 className="text-lg font-semibold mb-3">Tabs</h3>
              <Tabs
                tabs={["Vue 1", "Vue 2", "Vue 3"]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <div className="p-4 mt-2 bg-surface-sunken rounded-lg">
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

      <InlineMenu
        tabs={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
          { name: "Contact", href: "/contact" },
        ]}
      />
    </div>
  );
}
