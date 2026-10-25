import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { formatShortDate, todayInput } from '../utils/dates';

const categories = ['Sanitary pads', 'Tampons', 'Menstrual cups', 'Period underwear', 'Reusable cloth pads', 'Panty liners', 'Other period-care products'];
const today = todayInput();
const currentMonth = today.slice(0, 7);
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

type Essential = { id: number; name: string; category: string; quantity: number; unit: string; lowStock: number; cost: number; restockDate: string; notes: string };
type ShoppingItem = { id: number; name: string; category: string; quantity: number; price: number; purchased: boolean };
type Expense = { id: number; name: string; category: string; amount: number; date: string; notes: string };
type CalcItem = { id: number; name: string; kind: 'disposable' | 'reusable'; packCost: number; itemsPerPack: number; usage: number; periods: number; replacementCost: number; lifespan: number };
type CalcDraft = { name: string; kind: 'disposable' | 'reusable'; packCost: string; itemsPerPack: string; usage: string; periods: string; replacementCost: string; lifespan: string };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="care-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="care-modal" role="dialog" aria-modal="true" aria-labelledby="care-modal-title"><div className="care-modal-head"><h2 id="care-modal-title">{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}</section></div>;
}

function Feedback({ message }: { message: string }) {
  return message ? <div className="care-feedback" role="status"><span aria-hidden="true">✓</span>{message}</div> : null;
}

const blankEssential = { name: '', category: categories[0], quantity: '0', unit: 'pieces', lowStock: '2', cost: '', restockDate: '', notes: '' };
const blankShopping = { name: '', category: categories[0], quantity: '1', price: '' };
const blankExpense = { name: '', category: categories[0], amount: '', date: today, notes: '' };
const blankCalc: CalcDraft = { name: '', kind: 'disposable', packCost: '', itemsPerPack: '', usage: '', periods: '12', replacementCost: '', lifespan: '12' };

export function CareBudgetPage({ onBack }: { onBack: () => void }) {
  const [budget, setBudget] = useState<{ amount: number; month: string } | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ amount: '', month: currentMonth });
  const [budgetError, setBudgetError] = useState('');
  const [essentials, setEssentials] = useState<Essential[]>([]);
  const [essentialDraft, setEssentialDraft] = useState(blankEssential);
  const [essentialEditing, setEssentialEditing] = useState<number | null>(null);
  const [essentialOpen, setEssentialOpen] = useState(false);
  const [essentialError, setEssentialError] = useState('');
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [shoppingDraft, setShoppingDraft] = useState(blankShopping);
  const [shoppingEditing, setShoppingEditing] = useState<number | null>(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [shoppingError, setShoppingError] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDraft, setExpenseDraft] = useState(blankExpense);
  const [expenseEditing, setExpenseEditing] = useState<number | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'essential' | 'shopping' | 'expense' | 'purchased'; id?: number } | null>(null);
  const [calcDraft, setCalcDraft] = useState(blankCalc);
  const [calcItems, setCalcItems] = useState<CalcItem[]>([]);
  const [calcError, setCalcError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const monthlyExpenses = useMemo(() => expenses.filter(expense => expense.date.startsWith(currentMonth)), [expenses]);
  const spent = monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  const remaining = (budget?.amount ?? 0) - spent;
  const percentage = budget?.amount ? Math.round((spent / budget.amount) * 100) : 0;
  const budgetState = percentage > 100 ? 'over' : percentage >= 80 ? 'warning' : 'normal';
  const nextRestock = essentials.map(item => item.restockDate).filter(date => date && date >= today).sort()[0];
  const shoppingTotal = shopping.filter(item => !item.purchased).reduce((total, item) => total + item.quantity * item.price, 0);

  const saveBudget = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(budgetDraft.amount);
    if (!amount || amount <= 0) return setBudgetError('Enter a monthly budget greater than ₹0.');
    setBudget({ amount, month: budgetDraft.month || currentMonth });
    setBudgetOpen(false);
    setBudgetError('');
    setFeedback('Monthly budget updated.');
  };

  const openEssential = (item?: Essential) => {
    setEssentialEditing(item?.id ?? null);
    setEssentialDraft(item ? { name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, lowStock: String(item.lowStock), cost: String(item.cost), restockDate: item.restockDate, notes: item.notes } : blankEssential);
    setEssentialError('');
    setEssentialOpen(true);
  };
  const saveEssential = (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(essentialDraft.quantity);
    const lowStock = Number(essentialDraft.lowStock);
    const cost = Number(essentialDraft.cost);
    if (!essentialDraft.name.trim()) return setEssentialError('Add a product name.');
    if (quantity < 0 || lowStock < 0 || cost < 0) return setEssentialError('Quantities and costs cannot be negative.');
    const item = { id: essentialEditing ?? Date.now(), name: essentialDraft.name.trim(), category: essentialDraft.category, quantity, unit: essentialDraft.unit.trim() || 'items', lowStock, cost, restockDate: essentialDraft.restockDate, notes: essentialDraft.notes };
    setEssentials(previous => essentialEditing ? previous.map(existing => existing.id === essentialEditing ? item : existing) : [...previous, item]);
    setEssentialOpen(false);
    setFeedback(essentialEditing ? 'Essential updated.' : 'Essential added.');
  };

  const openShopping = (item?: ShoppingItem) => {
    setShoppingEditing(item?.id ?? null);
    setShoppingDraft(item ? { name: item.name, category: item.category, quantity: String(item.quantity), price: String(item.price) } : blankShopping);
    setShoppingError('');
    setShoppingOpen(true);
  };
  const saveShopping = (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(shoppingDraft.quantity);
    const price = Number(shoppingDraft.price);
    if (!shoppingDraft.name.trim()) return setShoppingError('Add a product name.');
    if (!quantity || quantity <= 0 || price < 0) return setShoppingError('Quantity must be at least 1 and price cannot be negative.');
    const item = { id: shoppingEditing ?? Date.now(), name: shoppingDraft.name.trim(), category: shoppingDraft.category, quantity, price, purchased: shoppingEditing ? shopping.find(existing => existing.id === shoppingEditing)?.purchased ?? false : false };
    setShopping(previous => shoppingEditing ? previous.map(existing => existing.id === shoppingEditing ? item : existing) : [...previous, item]);
    setShoppingOpen(false);
    setFeedback(shoppingEditing ? 'Shopping item updated.' : 'Shopping item added.');
  };

  const openExpense = (expense?: Expense, shoppingItem?: ShoppingItem) => {
    setExpenseEditing(expense?.id ?? null);
    setExpenseDraft(expense ? { name: expense.name, category: expense.category, amount: String(expense.amount), date: expense.date, notes: expense.notes } : shoppingItem ? { name: shoppingItem.name, category: shoppingItem.category, amount: String(shoppingItem.quantity * shoppingItem.price), date: today, notes: 'Recorded from shopping list after confirmation.' } : blankExpense);
    setExpenseError('');
    setExpenseOpen(true);
  };
  const saveExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(expenseDraft.amount);
    if (!expenseDraft.name.trim()) return setExpenseError('Add an expense name.');
    if (!amount || amount <= 0) return setExpenseError('Enter an amount greater than ₹0.');
    if (!expenseDraft.date) return setExpenseError('Choose the purchase date.');
    const expense = { id: expenseEditing ?? Date.now(), name: expenseDraft.name.trim(), category: expenseDraft.category, amount, date: expenseDraft.date, notes: expenseDraft.notes };
    setExpenses(previous => expenseEditing ? previous.map(existing => existing.id === expenseEditing ? expense : existing) : [...previous, expense]);
    setExpenseOpen(false);
    setFeedback(expenseEditing ? 'Expense updated.' : 'Expense recorded.');
  };

  const calculate = (item: typeof calcDraft | CalcItem) => {
    const periods = Number(item.periods) || 12;
    if (item.kind === 'reusable') {
      const yearly = (Number(item.replacementCost) || 0) * (12 / Math.max(1, Number(item.lifespan) || 1));
      return { period: yearly / periods, month: yearly / 12, year: yearly };
    }
    const perItem = (Number(item.packCost) || 0) / Math.max(1, Number(item.itemsPerPack) || 1);
    const perPeriod = perItem * (Number(item.usage) || 0);
    return { period: perPeriod, month: (perPeriod * periods) / 12, year: perPeriod * periods };
  };
  const preview = calculate(calcDraft);
  const addCalculation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!calcDraft.name.trim()) return setCalcError('Add a product name or category.');
    if (calcDraft.kind === 'disposable' && (!Number(calcDraft.packCost) || !Number(calcDraft.itemsPerPack) || !Number(calcDraft.usage))) return setCalcError('Add a positive pack cost, item count, and typical usage.');
    if (calcDraft.kind === 'reusable' && (!Number(calcDraft.replacementCost) || !Number(calcDraft.lifespan))) return setCalcError('Add a positive replacement cost and expected lifespan.');
    setCalcItems(previous => [...previous, { id: Date.now(), name: calcDraft.name.trim(), kind: calcDraft.kind, packCost: Number(calcDraft.packCost), itemsPerPack: Number(calcDraft.itemsPerPack), usage: Number(calcDraft.usage), periods: Number(calcDraft.periods) || 12, replacementCost: Number(calcDraft.replacementCost), lifespan: Number(calcDraft.lifespan) }]);
    setCalcDraft(blankCalc);
    setCalcError('');
  };
  const calcTotals = calcItems.reduce((totals, item) => { const result = calculate(item); return { period: totals.period + result.period, year: totals.year + result.year }; }, { period: 0, year: 0 });

  const confirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'essential') setEssentials(previous => previous.filter(item => item.id !== confirmAction.id));
    if (confirmAction.type === 'shopping') setShopping(previous => previous.filter(item => item.id !== confirmAction.id));
    if (confirmAction.type === 'expense') setExpenses(previous => previous.filter(item => item.id !== confirmAction.id));
    if (confirmAction.type === 'purchased') setShopping(previous => previous.filter(item => !item.purchased));
    setConfirmAction(null);
    setFeedback('Changes saved.');
  };

  const scrollToEssentials = () => document.getElementById('care-essentials')?.scrollIntoView({ behavior: 'smooth' });

  return <section className="care-page">
    <header className="care-hero">
      <Button kind="text" onClick={onBack}>← Back</Button>
      <div><span className="eyebrow">PERIOD CARE PLANNING</span><h1>Period Care &amp; <em>Budget Planner.</em></h1><p className="care-subtitle">Plan your period essentials, manage your budget, and make period care more affordable.</p><p>Your period care should fit your needs and your budget. Plan ahead, track your essentials, and stay prepared for your next cycle.</p><div className="care-hero-actions"><Button onClick={() => setBudgetOpen(true)}>Set Monthly Budget</Button><Button kind="outline" onClick={scrollToEssentials}>Manage Essentials</Button></div></div>
    </header>

    <Feedback message={feedback} />

    <section className="budget-dashboard" aria-labelledby="budget-heading">
      <div className="care-section-heading"><span className="eyebrow">YOUR MONTHLY PLAN</span><h2 id="budget-heading">Budget dashboard</h2><Button kind="text" onClick={() => { setBudgetDraft({ amount: budget ? String(budget.amount) : '', month: budget?.month ?? currentMonth }); setBudgetOpen(true); }}>{budget ? 'Edit budget' : 'Set a budget'} →</Button></div>
      {!budget && <div className="care-empty compact"><strong>No monthly budget set yet.</strong><p>Create a flexible plan to compare recorded expenses with the amount you choose.</p><Button onClick={() => setBudgetOpen(true)}>Set Monthly Budget</Button></div>}
      <div className="budget-cards">
        <article><span>Monthly Budget</span><strong>{budget ? money(budget.amount) : 'Not set'}</strong><small>{budget ? `For ${new Date(`${budget.month}-02`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` : 'Choose an amount that works for you'}</small></article>
        <article><span>Spent This Month</span><strong>{money(spent)}</strong><small>{monthlyExpenses.length} recorded {monthlyExpenses.length === 1 ? 'expense' : 'expenses'}</small></article>
        <article className={budget && remaining < 0 ? 'attention' : ''}><span>Budget Remaining</span><strong>{budget ? money(remaining) : 'Set a budget'}</strong><small>{budget && remaining < 0 ? 'Recorded spending is above this plan' : 'Based only on recorded expenses'}</small></article>
        <article><span>Next Restock</span><strong>{nextRestock ? formatShortDate(nextRestock) : 'No restocks planned'}</strong><small>{nextRestock ? 'From your essentials list' : 'Add an optional restock date'}</small></article>
      </div>
      {budget && <div className={`budget-progress ${budgetState}`}><div><span>{Math.max(0, percentage)}% of budget recorded as spent</span><strong>{money(spent)} of {money(budget.amount)}</strong></div><div className="budget-progress-track"><i style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}></i></div><p>{budgetState === 'over' ? 'Your recorded expenses are above the current plan. You can review priorities or adjust the budget without removing essentials.' : budgetState === 'warning' ? 'You are approaching the amount planned for this month.' : 'Your plan updates only when you record an expense.'}</p></div>}
    </section>

    <section className="care-section" id="care-essentials">
      <div className="care-section-heading"><div><span className="eyebrow">SUPPLY PLANNING</span><h2>My Period Essentials</h2><p>Keep a personal list of the supplies you use. InSync does not order or restock products automatically.</p></div><Button onClick={() => openEssential()}>Add Essential</Button></div>
      {!essentials.length ? <div className="care-empty"><span aria-hidden="true">○</span><h3>Your essentials list is ready when you are.</h3><p>Add the products you regularly use, their quantity, and an optional restock or replacement date.</p><Button onClick={() => openEssential()}>Add Essential</Button></div> : <div className="essential-list">{essentials.map(item => <article className={item.quantity <= item.lowStock ? 'low-stock' : ''} key={item.id}><div className="essential-main"><div className="care-item-icon" aria-hidden="true"></div><div><span>{item.category}</span><h3>{item.name}</h3><p>{item.quantity} {item.unit} available · Estimated replacement {money(item.cost)}</p></div></div><div className="stock-status">{item.quantity <= item.lowStock ? <strong>Low Stock</strong> : <span>Stock planned</span>}<small>{item.restockDate ? `${isReusable(item.category) ? 'Replace' : 'Restock'} ${formatShortDate(item.restockDate)}` : 'No date planned'}</small></div><div className="quantity-control" aria-label={`Update quantity for ${item.name}`}><button onClick={() => setEssentials(previous => previous.map(existing => existing.id === item.id ? { ...existing, quantity: Math.max(0, existing.quantity - 1) } : existing))} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button onClick={() => setEssentials(previous => previous.map(existing => existing.id === item.id ? { ...existing, quantity: existing.quantity + 1 } : existing))} aria-label="Increase quantity">+</button></div><div className="row-actions"><button onClick={() => openEssential(item)}>Edit Essential</button><button onClick={() => { setEssentials(previous => previous.map(existing => existing.id === item.id ? { ...existing, quantity: Math.max(existing.lowStock + 1, 1), restockDate: '' } : existing)); setFeedback(`${item.name} marked as restocked.`); }}>Mark as Restocked</button><button className="danger" onClick={() => setConfirmAction({ type: 'essential', id: item.id })}>Remove</button></div>{item.quantity <= item.lowStock && <p className="low-stock-note">This item has reached your low-stock threshold. Consider planning a restock when convenient.</p>}</article>)}</div>}
    </section>

    <section className="care-section product-finder">
      <div className="care-section-heading"><div><span className="eyebrow">EXTERNAL SHOPPING</span><h2>Find Your Period Essentials</h2><p>Move from planning to an external shopping platform when you are ready. InSync does not receive live product or stock information.</p></div></div>
      <div className="finder-card"><label>What are you looking for?<input value={productSearch} onChange={event => setProductSearch(event.target.value)} placeholder="e.g. sanitary pads or menstrual cup" /></label><div className="finder-categories">{categories.slice(0, 6).map(category => <button className={productSearch === category ? 'selected' : ''} onClick={() => setProductSearch(category)} key={category}>{category}</button>)}</div><div className="finder-actions"><Button kind="outline" onClick={() => window.open('https://blinkit.com/', '_blank', 'noopener,noreferrer')}>Find on Blinkit ↗</Button></div><p className="external-note">This opens Blinkit’s official homepage in a new tab. Search manually for “{productSearch || 'your period-care product'}”. InSync is not connected to Blinkit through an API and cannot verify prices, availability, or delivery.</p></div>
    </section>

    <section className="care-section calculator-section">
      <div className="care-section-heading"><div><span className="eyebrow">COST ESTIMATOR</span><h2>What Does Period Care Cost Me?</h2><p>Add disposable and reusable products separately to estimate costs without double-counting.</p></div>{calcItems.length > 0 && <Button kind="text" onClick={() => { setCalcItems([]); setCalcDraft(blankCalc); }}>Reset Calculator</Button>}</div>
      <div className="calculator-layout"><form className="care-form calculator-form" onSubmit={addCalculation}><div className="segmented"><button type="button" className={calcDraft.kind === 'disposable' ? 'selected' : ''} onClick={() => setCalcDraft({ ...blankCalc, kind: 'disposable' })}>Disposable</button><button type="button" className={calcDraft.kind === 'reusable' ? 'selected' : ''} onClick={() => setCalcDraft({ ...blankCalc, kind: 'reusable' })}>Reusable</button></div><label>Product name or category<input value={calcDraft.name} onChange={event => setCalcDraft({ ...calcDraft, name: event.target.value })} placeholder="e.g. pads" /></label>{calcDraft.kind === 'disposable' ? <div className="care-form-grid"><label>Cost per pack (₹)<input type="number" min="0" value={calcDraft.packCost} onChange={event => setCalcDraft({ ...calcDraft, packCost: event.target.value })} /></label><label>Items per pack<input type="number" min="1" value={calcDraft.itemsPerPack} onChange={event => setCalcDraft({ ...calcDraft, itemsPerPack: event.target.value })} /></label><label>Quantity used per period<input type="number" min="1" value={calcDraft.usage} onChange={event => setCalcDraft({ ...calcDraft, usage: event.target.value })} /></label><label>Periods per year<input type="number" min="1" max="24" value={calcDraft.periods} onChange={event => setCalcDraft({ ...calcDraft, periods: event.target.value })} /></label></div> : <div className="care-form-grid"><label>Replacement cost (₹)<input type="number" min="0" value={calcDraft.replacementCost} onChange={event => setCalcDraft({ ...calcDraft, replacementCost: event.target.value })} /></label><label>Expected lifespan (months)<input type="number" min="1" value={calcDraft.lifespan} onChange={event => setCalcDraft({ ...calcDraft, lifespan: event.target.value })} /></label><label>Periods per year<input type="number" min="1" max="24" value={calcDraft.periods} onChange={event => setCalcDraft({ ...calcDraft, periods: event.target.value })} /></label></div>}<div className="calculator-preview"><span>Current estimate</span><strong>{money(preview.period)} per period</strong><small>{money(preview.month)} per month · {money(preview.year)} per year</small></div>{calcError && <span className="field-error">{calcError}</span>}<Button type="submit">Add to Calculation</Button></form><div className="calculation-results">{!calcItems.length ? <div className="care-empty compact"><strong>No products added yet.</strong><p>Enter your own prices and usage to create an estimate.</p></div> : <>{calcItems.map(item => { const result = calculate(item); return <article key={item.id}><div><span>{item.kind}</span><h3>{item.name}</h3></div><div><strong>{money(result.period)}</strong><small>per period</small></div><div><strong>{money(result.year)}</strong><small>per year</small></div><button onClick={() => setCalcItems(previous => previous.filter(existing => existing.id !== item.id))} aria-label={`Remove ${item.name}`}>×</button></article>; })}<div className="calculation-total"><span>Combined estimate</span><strong>{money(calcTotals.period)} per period</strong><strong>{money(calcTotals.year)} per year</strong></div></>}</div></div><p className="estimate-disclaimer">Estimates are based on the values you enter. Actual costs vary depending on product choice, usage, prices, and replacement frequency.</p>
    </section>

    <section className="care-section shopping-section">
      <div className="care-section-heading"><div><span className="eyebrow">PURCHASE PLANNING</span><h2>My Shopping List</h2><p>Plan purchases without placing an order through InSync.</p></div><Button onClick={() => openShopping()}>Add an Item</Button></div>
      <div className="shopping-summary"><div><span>Estimated unpurchased total</span><strong>{money(shoppingTotal)}</strong></div>{budget && <p className={shoppingTotal > Math.max(0, remaining) ? 'attention' : ''}>{shoppingTotal > Math.max(0, remaining) ? 'This estimate is above the remaining monthly budget. Consider reviewing priorities or adjusting the plan—essential items are never blocked.' : `${money(Math.max(0, remaining - shoppingTotal))} would remain after this estimated list.`}</p>}</div>
      {!shopping.length ? <div className="care-empty compact"><strong>Your shopping list is empty.</strong><p>Add products you plan to purchase. Estimated prices are entered by you and are not live prices.</p><Button onClick={() => openShopping()}>Add an Item</Button></div> : <div className="shopping-list">{shopping.map(item => <article className={item.purchased ? 'purchased' : ''} key={item.id}><label><input type="checkbox" checked={item.purchased} onChange={() => setShopping(previous => previous.map(existing => existing.id === item.id ? { ...existing, purchased: !existing.purchased } : existing))} /><span></span></label><div><span>{item.category}</span><h3>{item.name}</h3><p>{item.quantity} × {money(item.price)} estimated</p></div><strong>{money(item.quantity * item.price)}</strong><div className="row-actions"><button onClick={() => openShopping(item)}>Edit</button><button onClick={() => openExpense(undefined, item)}>Record Expense</button><button className="danger" onClick={() => setConfirmAction({ type: 'shopping', id: item.id })}>Remove</button></div></article>)}</div>}
      {shopping.some(item => item.purchased) && <Button kind="text" onClick={() => setConfirmAction({ type: 'purchased' })}>Clear purchased items</Button>}
    </section>

    <section className="care-section expenses-section">
      <div className="care-section-heading"><div><span className="eyebrow">RECORDED SPENDING</span><h2>Recent Expenses</h2><p>Only expenses you explicitly save here count toward the dashboard.</p></div><Button onClick={() => openExpense()}>Add Expense</Button></div>
      {!monthlyExpenses.length ? <div className="care-empty compact"><strong>No expenses recorded this month.</strong><p>Shopping-list estimates do not count as spending unless you confirm and save an expense.</p><Button onClick={() => openExpense()}>Add Expense</Button></div> : <div className="expense-list">{monthlyExpenses.sort((a, b) => b.date.localeCompare(a.date)).map(expense => <article key={expense.id}><div className="expense-date"><strong>{new Date(`${expense.date}T00:00:00`).getDate()}</strong><span>{new Date(`${expense.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span></div><div><span>{expense.category}</span><h3>{expense.name}</h3>{expense.notes && <p>{expense.notes}</p>}</div><strong>{money(expense.amount)}</strong><div className="row-actions"><button onClick={() => openExpense(expense)}>Edit</button><button className="danger" onClick={() => setConfirmAction({ type: 'expense', id: expense.id })}>Delete</button></div></article>)}</div>}
    </section>

    <section className="budget-tips"><div><span className="eyebrow">SUPPORTIVE PLANNING</span><h2>Period Care on a Budget</h2><p>Affordability matters, but comfort, hygiene, accessibility, and personal needs matter too.</p></div><ul><li>Plan ahead so you can restock essentials before running out.</li><li>Compare the cost per item rather than only the pack price.</li><li>Consider reusable products if they suit your preferences and circumstances.</li><li>Follow the manufacturer’s instructions for safe use, cleaning, and replacement.</li><li>Keep a backup supply for unexpected changes in your cycle.</li><li>Choose products based on comfort, accessibility, and personal needs rather than price alone.</li></ul></section>

    {budgetOpen && <Modal title={budget ? 'Edit Monthly Budget' : 'Set Monthly Budget'} onClose={() => setBudgetOpen(false)}><form className="care-form" onSubmit={saveBudget}><label>Monthly budget amount (₹)<input autoFocus type="number" min="1" value={budgetDraft.amount} onChange={event => { setBudgetDraft({ ...budgetDraft, amount: event.target.value }); setBudgetError(''); }} placeholder="e.g. 800" /></label><label>Budget start month <span>Optional</span><input type="month" value={budgetDraft.month} onChange={event => setBudgetDraft({ ...budgetDraft, month: event.target.value })} /></label>{budgetError && <span className="field-error">{budgetError}</span>}<div className="modal-actions"><Button kind="outline" onClick={() => setBudgetOpen(false)}>Cancel</Button><Button type="submit">Save Budget</Button></div></form></Modal>}
    {essentialOpen && <Modal title={essentialEditing ? 'Edit Essential' : 'Add Essential'} onClose={() => setEssentialOpen(false)}><form className="care-form" onSubmit={saveEssential}><label>Product name<input autoFocus value={essentialDraft.name} onChange={event => setEssentialDraft({ ...essentialDraft, name: event.target.value })} /></label><label>Category<select value={essentialDraft.category} onChange={event => setEssentialDraft({ ...essentialDraft, category: event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><div className="care-form-grid"><label>Quantity available<input type="number" min="0" value={essentialDraft.quantity} onChange={event => setEssentialDraft({ ...essentialDraft, quantity: event.target.value })} /></label><label>Quantity unit<input value={essentialDraft.unit} onChange={event => setEssentialDraft({ ...essentialDraft, unit: event.target.value })} placeholder="pieces, packs, items" /></label><label>Low-stock threshold<input type="number" min="0" value={essentialDraft.lowStock} onChange={event => setEssentialDraft({ ...essentialDraft, lowStock: event.target.value })} /></label><label>Replacement cost (₹)<input type="number" min="0" value={essentialDraft.cost} onChange={event => setEssentialDraft({ ...essentialDraft, cost: event.target.value })} /></label></div><label>{isReusable(essentialDraft.category) ? 'Replacement date' : 'Restock date'} <span>Optional</span><input type="date" value={essentialDraft.restockDate} onChange={event => setEssentialDraft({ ...essentialDraft, restockDate: event.target.value })} /></label><label>Notes <span>Optional</span><textarea rows={3} value={essentialDraft.notes} onChange={event => setEssentialDraft({ ...essentialDraft, notes: event.target.value })}></textarea></label>{essentialError && <span className="field-error">{essentialError}</span>}<div className="modal-actions"><Button kind="outline" onClick={() => setEssentialOpen(false)}>Cancel</Button><Button type="submit">Save Essential</Button></div></form></Modal>}
    {shoppingOpen && <Modal title={shoppingEditing ? 'Edit Shopping Item' : 'Add Shopping Item'} onClose={() => setShoppingOpen(false)}><form className="care-form" onSubmit={saveShopping}><label>Product name<input autoFocus value={shoppingDraft.name} onChange={event => setShoppingDraft({ ...shoppingDraft, name: event.target.value })} /></label><label>Category<select value={shoppingDraft.category} onChange={event => setShoppingDraft({ ...shoppingDraft, category: event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><div className="care-form-grid"><label>Desired quantity<input type="number" min="1" value={shoppingDraft.quantity} onChange={event => setShoppingDraft({ ...shoppingDraft, quantity: event.target.value })} /></label><label>Estimated unit or pack price (₹)<input type="number" min="0" value={shoppingDraft.price} onChange={event => setShoppingDraft({ ...shoppingDraft, price: event.target.value })} /></label></div>{shoppingError && <span className="field-error">{shoppingError}</span>}<div className="modal-actions"><Button kind="outline" onClick={() => setShoppingOpen(false)}>Cancel</Button><Button type="submit">Save Item</Button></div></form></Modal>}
    {expenseOpen && <Modal title={expenseEditing ? 'Edit Expense' : 'Record Expense'} onClose={() => setExpenseOpen(false)}><form className="care-form" onSubmit={saveExpense}><label>Expense name<input autoFocus value={expenseDraft.name} onChange={event => setExpenseDraft({ ...expenseDraft, name: event.target.value })} /></label><label>Category<select value={expenseDraft.category} onChange={event => setExpenseDraft({ ...expenseDraft, category: event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><div className="care-form-grid"><label>Amount paid (₹)<input type="number" min="0" value={expenseDraft.amount} onChange={event => setExpenseDraft({ ...expenseDraft, amount: event.target.value })} /></label><label>Purchase date<input type="date" max={today} value={expenseDraft.date} onChange={event => setExpenseDraft({ ...expenseDraft, date: event.target.value })} /></label></div><label>Notes <span>Optional</span><textarea rows={3} value={expenseDraft.notes} onChange={event => setExpenseDraft({ ...expenseDraft, notes: event.target.value })}></textarea></label>{expenseError && <span className="field-error">{expenseError}</span>}<div className="modal-actions"><Button kind="outline" onClick={() => setExpenseOpen(false)}>Cancel</Button><Button type="submit">Save Expense</Button></div></form></Modal>}
    {confirmAction && <Modal title={confirmAction.type === 'purchased' ? 'Clear purchased items?' : 'Remove this entry?'} onClose={() => setConfirmAction(null)}><div className="confirm-copy"><p>This action updates only the temporary data in this page and cannot be undone during this session.</p><div className="modal-actions"><Button kind="outline" onClick={() => setConfirmAction(null)}>Cancel</Button><Button onClick={confirm}>Confirm</Button></div></div></Modal>}
  </section>;
}


function isReusable(category: string) {
  return ['Menstrual cups', 'Period underwear', 'Reusable cloth pads'].includes(category);
}
