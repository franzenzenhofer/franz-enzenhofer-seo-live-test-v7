export const InfoRow = ({ k, v }: { k: string; v: string }) => (
  <div className="grid grid-cols-3 gap-2">
    <span className="k col-span-1">{k}</span>
    <span className="v col-span-2">{v}</span>
  </div>
)

