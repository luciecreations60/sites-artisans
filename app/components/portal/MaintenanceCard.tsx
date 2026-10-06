type Props = {
  hoursIncluded: number;
  hoursUsed: number;
};

export function MaintenanceCard({ hoursIncluded, hoursUsed }: Props) {
  const used = Number(hoursUsed) || 0;
  const included = Number(hoursIncluded) || 0;
  const remaining = Math.max(0, included - used);

  return (
    <div className="portal-maintenance">
      <p className="portal-maintenance__lead">
        <strong>{remaining} h</strong> disponible{remaining > 1 ? "s" : ""} ce mois-ci
      </p>
      <dl className="portal-maintenance__stats">
        <div>
          <dt>Utilisées</dt>
          <dd>{used} h</dd>
        </div>
        <div>
          <dt>Restantes</dt>
          <dd>{remaining} h</dd>
        </div>
        <div>
          <dt>Incluses</dt>
          <dd>{included} h</dd>
        </div>
      </dl>
    </div>
  );
}
