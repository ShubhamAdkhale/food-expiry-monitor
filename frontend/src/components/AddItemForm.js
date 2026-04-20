import React, { useState } from 'react';
import { FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6';
import './Items.css';

const CATEGORY_UNITS = {
  General:'units', Dairy:'L', Meat:'kg',
  Vegetables:'kg', Fruits:'kg', Beverages:'L',
  Bakery:'packets', Frozen:'kg',
};

const ALL_UNITS = [
  {value:'L',       label:'L — litres'},
  {value:'mL',      label:'mL — millilitres'},
  {value:'kg',      label:'kg — kilograms'},
  {value:'g',       label:'g — grams'},
  {value:'units',   label:'units / pieces'},
  {value:'packets', label:'packets'},
  {value:'cans',    label:'cans'},
  {value:'bottles', label:'bottles'},
  {value:'boxes',   label:'boxes'},
  {value:'bags',    label:'bags'},
  {value:'loaves',  label:'loaves'},
  {value:'dozen',   label:'dozen'},
  {value:'servings',label:'servings'},
  {value:'lbs',     label:'lbs — pounds'},
  {value:'oz',      label:'oz — ounces'},
];

const CATEGORIES = ['General','Dairy','Meat','Vegetables','Fruits','Beverages','Bakery','Frozen'];

export default function AddItemForm({ apiUrl, userEmail, onItemAdded }) {
  const [name,       setName]       = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category,   setCategory]   = useState('General');
  const [quantity,   setQuantity]   = useState('');
  const [unit,       setUnit]       = useState('units');
  const [submitting, setSubmitting] = useState(false);
  const [flash,      setFlash]      = useState(null);

  const handleCategory = (cat) => { setCategory(cat); setUnit(CATEGORY_UNITS[cat] || 'units'); };

  const showFlash = (type, text) => {
    setFlash({type, text});
    setTimeout(() => setFlash(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          name, expiryDate, category, userEmail,
          quantity: quantity !== '' ? Number(quantity) : undefined,
          unit:     quantity !== '' ? unit : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setName(''); setExpiryDate(''); setCategory('General');
        setQuantity(''); setUnit('units');
        showFlash('success', `"${name}" added to your pantry!`);
        onItemAdded();
      } else showFlash('error', data.error || 'Something went wrong.');
    } catch { showFlash('error', 'Network error. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  return (
    <div className="form-panel">
      <div className="form-panel-hdr">
        <h2 className="form-panel-title">Add Food Item</h2>
        <p  className="form-panel-sub">Add items now so you can focus on the ones expiring soon.</p>
      </div>

      {flash && (
        <div className={`form-flash form-flash-${flash.type}`}>
          <span className="flash-icon" aria-hidden>
            {flash.type === 'success' ? <FaCircleCheck /> : <FaTriangleExclamation />}
          </span>
          {flash.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-form">

        <div className="ff-group">
          <label>Item Name <span className="req">*</span></label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g., Milk, Chicken, Yogurt" required />
          <span className="ff-hint">Tip: add the name printed on the package for accurate alerts.</span>
        </div>

        <div className="ff-group">
          <label>Expiry Date <span className="req">*</span></label>
          <input type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} required />
          <span className="ff-hint">Tip: add the date printed on the package for accurate alerts.</span>
        </div>

        <div className="ff-group">
          <label>Category</label>
          <select value={category} onChange={e=>handleCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="ff-group">
          <label>Quantity <span className="opt">(optional)</span></label>
          <div className="qty-row">
            <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)}
              placeholder="e.g. 2" min="0" step="any" className="qty-num" />
            <select value={unit} onChange={e=>setUnit(e.target.value)} className="qty-unit">
              {ALL_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <span className="ff-hint">Suggested for {category}: <strong>{CATEGORY_UNITS[category]}</strong></span>
        </div>

        <button type="submit" className="add-btn" disabled={submitting}>
          {submitting ? <><span className="btn-spinner sm-spinner"/>Adding…</> : 'Add item'}
        </button>
      </form>
    </div>
  );
}