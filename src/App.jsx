import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const CARS = 'cars';
const SUBMISSIONS = 'submissions';

function formatTimestamp(ts) {
  if (ts && typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleString();
  }
  return 'just now';
}

export default function App() {
  const [cars, setCars] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [newCarTitle, setNewCarTitle] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [newCarVin, setNewCarVin] = useState('');

  const [editingCar, setEditingCar] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editVin, setEditVin] = useState('');

  const [submissionCarId, setSubmissionCarId] = useState('');
  const [submissionDriverName, setSubmissionDriverName] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  useEffect(() => {
    const unsubCars = onSnapshot(
      query(collection(db, CARS), orderBy('createdAt', 'asc')),
      (snap) => {
        setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    const unsubSubs = onSnapshot(
      query(collection(db, SUBMISSIONS), orderBy('timestamp', 'desc')),
      (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message),
    );
    return () => {
      unsubCars();
      unsubSubs();
    };
  }, []);

  async function addCar(e) {
    e.preventDefault();
    const title = newCarTitle.trim();
    if (!title) return;
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, CARS), {
        title,
        licensePlate: newCarPlate.trim(),
        vin: newCarVin.trim(),
        createdAt: serverTimestamp(),
      });
      setNewCarTitle('');
      setNewCarPlate('');
      setNewCarVin('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(car) {
    setEditingCar(car);
    setEditTitle(car.title || '');
    setEditPlate(car.licensePlate || '');
    setEditVin(car.vin || '');
  }

  function closeEdit() {
    setEditingCar(null);
  }

  async function saveEdit(e) {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title || !editingCar) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, CARS, editingCar.id), {
        title,
        licensePlate: editPlate.trim(),
        vin: editVin.trim(),
      });
      closeEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addSubmission(e) {
    e.preventDefault();
    const driver = submissionDriverName.trim();
    if (!submissionCarId || !driver) return;
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, SUBMISSIONS), {
        carId: submissionCarId,
        driverName: driver,
        notes: submissionNotes.trim(),
        timestamp: serverTimestamp(),
      });
      setSubmissionCarId('');
      setSubmissionDriverName('');
      setSubmissionNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function carTitle(id) {
    const c = cars.find((c) => c.id === id);
    return c ? c.title : 'Unknown car';
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>IAC Vehicle Log</h1>
      </header>
      <main className="content">
        {error && <div className="error">Error: {error}</div>}

        <section>
          <h2>Add a Car</h2>
          <form onSubmit={addCar} className="form">
            <input
              placeholder="Car title (e.g. Silver Toyota)"
              value={newCarTitle}
              onChange={(e) => setNewCarTitle(e.target.value)}
              required
            />
            <input
              placeholder="License plate (optional — add later)"
              value={newCarPlate}
              onChange={(e) => setNewCarPlate(e.target.value)}
            />
            <input
              placeholder="VIN (optional — add later)"
              value={newCarVin}
              onChange={(e) => setNewCarVin(e.target.value)}
            />
            <button type="submit" disabled={!newCarTitle.trim() || saving}>
              Add Car
            </button>
          </form>
        </section>

        <section>
          <h2>Cars</h2>
          {loading && <p className="empty">Loading…</p>}
          {!loading && cars.length === 0 && (
            <p className="empty">No cars yet.</p>
          )}
          <div className="card-list">
            {cars.map((car) => (
              <div key={car.id} className="card">
                <h3>{car.title}</h3>
                <p>License plate: {car.licensePlate || '— not set —'}</p>
                <p>VIN: {car.vin || '— not set —'}</p>
                <button className="secondary" onClick={() => openEdit(car)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>New Submission</h2>
          {cars.length === 0 ? (
            <p className="empty">Add a car first.</p>
          ) : (
            <form onSubmit={addSubmission} className="form">
              <label>
                Select car
                <select
                  value={submissionCarId}
                  onChange={(e) => setSubmissionCarId(e.target.value)}
                  required
                >
                  <option value="">— pick a car —</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <input
                placeholder="Your name (driver)"
                value={submissionDriverName}
                onChange={(e) => setSubmissionDriverName(e.target.value)}
                required
              />
              <textarea
                placeholder="Notes / details"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={3}
              />
              <button
                type="submit"
                disabled={
                  !submissionCarId ||
                  !submissionDriverName.trim() ||
                  saving
                }
              >
                Submit
              </button>
            </form>
          )}
        </section>

        <section>
          <h2>All Submissions</h2>
          {submissions.length === 0 && !loading && (
            <p className="empty">No submissions yet.</p>
          )}
          <div className="card-list">
            {submissions.map((s) => (
              <div key={s.id} className="card">
                <h3>{carTitle(s.carId)}</h3>
                <p>Driver: {s.driverName}</p>
                <p>When: {formatTimestamp(s.timestamp)}</p>
                {s.notes && <p>Notes: {s.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      {editingCar && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Car</h2>
            <form onSubmit={saveEdit} className="form">
              <input
                placeholder="Car title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
              <input
                placeholder="License plate"
                value={editPlate}
                onChange={(e) => setEditPlate(e.target.value)}
              />
              <input
                placeholder="VIN"
                value={editVin}
                onChange={(e) => setEditVin(e.target.value)}
              />
              <div className="actions">
                <button type="submit" disabled={!editTitle.trim() || saving}>
                  Save
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
