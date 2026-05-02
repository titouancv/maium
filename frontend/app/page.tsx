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

export default function Home() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-surface pb-24 font-sans">
      {/* HEADER */}
      <TopBar
        title="Maium Dashboard"
        leftAction={<span className="text-2xl">🌍</span>}
        rightAction={
          <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center">
            T
          </div>
        }
      />

      {/* CONTENU PRINCIPAL */}
      <main className="px-4 py-6 flex flex-col gap-6">
        {/* Barre de recherche */}
        <SearchInput placeholder="Rechercher une action, un projet..." />

        {/* Carte Héro (Mise en avant) */}
        <Card
          padding="lg"
          className="bg-primary-subtle border-none"
        >
          <h2 className="text-2xl font-bold mb-2 text-text">
            Bienvenue ! 👋
          </h2>
          <p className="text-text-muted mb-5 text-sm">
            Vos composants Mobile-First sont prêts. Testez leur rendu et les
            zones tactiles.
          </p>
          <Button variant="primary" className="w-full">
            Démarrer le projet
          </Button>
        </Card>

        {/* Section Paramètres rapides */}
        <div>
          <h3 className="text-lg font-semibold mb-3 px-1">Réglages rapides</h3>
          <Card padding="md" className="flex flex-col gap-2">
            <Switch
              label="Activer les notifications"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            <Divider className="my-2" />
            <Switch label="Mode Hors-ligne" />
          </Card>
        </div>

        {/* Section Liste */}
        <div>
          <h3 className="text-lg font-semibold mb-3 px-1">Activité récente</h3>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                padding="sm"
                className="flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-sunken flex items-center justify-center text-xl shrink-0">
                  {i === 1 ? "🚀" : i === 2 ? "🎨" : "📱"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">
                    {i === 1
                      ? "Lancement du projet"
                      : i === 2
                        ? "Design System"
                        : "Intégration Mobile"}
                  </p>
                  <p className="text-xs text-text-muted">
                    Il y a {i} heure{i > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-primary"
                >
                  Voir
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <Fab>➕</Fab>

      {/* BOTTOM NAVIGATION */}
      <BottomNavigation>
        <Button
          variant="ghost"
          className="flex-1 flex-col items-center !h-full rounded-none"
        >
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] text-primary font-semibold">
            Accueil
          </span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col items-center !h-full rounded-none opacity-50"
        >
          <span className="text-2xl mb-1">📊</span>
          <span className="text-[10px]">Stats</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col items-center !h-full rounded-none opacity-50"
        >
          <span className="text-2xl mb-1">⚙️</span>
          <span className="text-[10px]">Options</span>
        </Button>
      </BottomNavigation>
    </div>
  );
}
