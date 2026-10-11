import type { DemoModules } from "~/lib/templates/demoModules";

type Props = {
  modules: DemoModules;
};

/** Signale honnêtement les options choisies sans composant démo. */
export function DemoModulesNote({ modules }: Props) {
  if (modules.unavailableSelected.length === 0) return null;
  return (
    <div className="demo-modules-note" role="status">
      <p>
        Certaines options de votre configuration n’ont pas encore de module interactif dans cette
        démo ({modules.unavailableSelected.join(", ")}). Elles restent listées dans votre
        configurateur sans être simulées ici.
      </p>
    </div>
  );
}
