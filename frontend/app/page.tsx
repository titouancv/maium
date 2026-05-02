"use client";

import React, { useState } from "react";
import { TopBar } from "../package/UI/Navigation/TopBar";
import { BottomNavigation } from "../package/UI/Navigation/BottomNavigation";
import { Card } from "../package/UI/Structure/Card";
import { Button } from "../package/UI/Essential/Button";
import { SearchInput } from "../package/UI/Utility/SearchInput";
import { Switch } from "../package/UI/Essential/Switch";
import { Divider } from "../package/UI/Structure/Divider";
import { Fab } from "../package/UI/Interactions/Fab";
import { TextInput } from "../package/UI/Essential/TextInput";
import { PasswordInput } from "../package/UI/Essential/PasswordInput";
import { Select } from "../package/UI/Essential/Select";
import { Spinner } from "../package/UI/Feedback/Spinner";
import { Skeleton } from "../package/UI/Feedback/Skeleton";
import { Tabs } from "../package/UI/Navigation/Tabs";

export default function DesignSystem() {
  const [switchState, setSwitchState] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-surface pb-24 font-sans text-text">
      <TopBar title="Design System" />

      <main className="px-4 py-8 flex flex-col gap-10">
        {/* ESSENTIAL */}
        <section>
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-border">
            1. Essential
          </h2>

          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Buttons (Variants)</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <h3 className="text-lg font-semibold mb-3 mt-4">
                Buttons (Sizes)
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
                <TextInput
                  label="Text Input"
                  placeholder="Entrez du texte..."
                />
                <TextInput
                  label="With Error"
                  placeholder="Entrez du texte..."
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
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-border">
            2. Structure
          </h2>

          <div className="space-y-6">
            {/* Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Cards (Paddings)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="none">
                  <div className="p-4 bg-primary-subtle text-primary">
                    No padding (Custom Content)
                  </div>
                </Card>
                <Card padding="sm">Small padding</Card>
                <Card padding="md">Medium padding (default)</Card>
                <Card padding="lg">Large padding</Card>
              </div>
            </div>

            {/* Divider */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Divider</h3>
              <Card>
                <div className="py-2">Item 1</div>
                <Divider />
                <div className="py-2">Item 2</div>
                <Divider />
                <div className="py-2">Item 3</div>
              </Card>
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        <section>
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-border">
            3. Feedback
          </h2>

          <div className="space-y-6">
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
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-border">
            4. Navigation (Preview)
          </h2>
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

      <Fab>✨</Fab>

      <BottomNavigation>
        <Button
          variant="ghost"
          className="flex-1 flex-col items-center !h-full rounded-none"
        >
          <span className="text-2xl mb-1">🎭</span>
          <span className="text-[10px] text-primary font-semibold">
            Composants
          </span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col items-center !h-full rounded-none opacity-50"
        >
          <span className="text-2xl mb-1">📱</span>
          <span className="text-[10px]">Mockup</span>
        </Button>
      </BottomNavigation>
    </div>
  );
}
