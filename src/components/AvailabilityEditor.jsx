// src/components/AvailabilityEditor.jsx
export default function AvailabilityEditor({ slots, onChange }) {
  function updateSlot(index, field, value) {
    const next = [...slots];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addSlot() {
    onChange([...slots, { id: `slot_${Date.now()}`, start: '', end: '' }]);
  }

  function removeSlot(index) {
    const next = slots.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ id: `slot_${Date.now()}`, start: '', end: '' }]);
  }

  return (
    <div className="page-stack compact-gap">
      {slots.map((slot, index) => (
        <div key={slot.id || index} className="availability-slot-card">
          <label>Start<input type="datetime-local" value={slot.start} onChange={(e) => updateSlot(index, 'start', e.target.value)} /></label>
          <label>End<input type="datetime-local" value={slot.end} onChange={(e) => updateSlot(index, 'end', e.target.value)} /></label>
          <button type="button" className="ghost-button danger-button" onClick={() => removeSlot(index)}>Remove slot</button>
        </div>
      ))}
      <button type="button" className="ghost-button" onClick={addSlot}>Add availability window</button>
    </div>
  );
}
