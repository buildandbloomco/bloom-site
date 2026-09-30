const LINE =
  "Rooted in Justice · Centered in Black Culture · Collective Care · Intentional Growth · Community · ";

export default function Ribbon() {
  return (
    <div className="ribbon" aria-hidden="true">
      <span>{LINE.repeat(4)}</span>
    </div>
  );
}
