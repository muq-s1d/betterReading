export default function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="bookcase">
      <div className="shelf-grid">{children}</div>
    </div>
  )
}
