"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowUpLeft, CalendarDays, CarFront, Check, ChevronLeft, Clock3, Droplets, Menu, RefreshCw, ShieldCheck, Sparkles, Wallet, X, CalendarCheck, Download, CircleCheck } from "lucide-react";
import { services, vehicles, money, dateKey, dateLabel, timeLabel, type ServiceId, type VehicleId } from "@/lib/catalog";

type Booking = { reference: string; name: string; model: string; service: ServiceId; vehicle: VehicleId; day: string; hour: number; duration: number; total: number; status: string };
type Access = { reference: string; token: string };
type ApiPayload = { error?: string; booking: Booking; slots: { hour: number; available: boolean }[] };
async function readResponse(response: Response): Promise<ApiPayload> {
 const data = await response.json();
 if (!data || typeof data !== "object") throw new Error("استجابة غير متوقعة. حاول مرة أخرى.");
 return data as ApiPayload;
}
const serviceIcons = [Droplets, Sparkles, ShieldCheck];
const faqs = [
 ["أي باقة تناسب سيارتي؟", "للعناية المعتادة اختر «انتعاش يومي». إذا كانت سيارتك تحتاج إلى تنظيف أعمق واستعادة اللمعان، اختر «لمعة متكاملة». باقة «حماية سيراميك» تضيف طبقة حماية بعد تجهيز الطلاء. حالة السيارة تحدد المعالجة المناسبة عند الفحص."],
 ["هل يختلف السعر حسب حجم السيارة؟", "نعم. السعر المعروض لسيارات السيدان. تُضاف ٨٠ ر.س للدفع الرباعي و١٢٠ ر.س للسيارات الكبيرة، ويظهر الإجمالي بوضوح قبل حفظ طلبك. الأسعار في هذه النسخة تجريبية وشاملة الضريبة."],
 ["كم يستغرق تلميع السيارة؟", "المدة التقديرية ساعتان لباقة انتعاش يومي، و٣ ساعات للعناية المتكاملة، و٥ ساعات لحماية السيراميك. المدة الفعلية تعتمد على حالة السيارة. تظهر المواعيد التي تتسع للباقة كاملة فقط."],
 ["هل يمكنني إلغاء الموعد أو تغييره؟", "يمكنك إلغاء طلبك من «حجوزاتي» ثم اختيار موعد جديد. يمكنك الوصول إلى حجوزاتك من الجهاز نفسه، أو باستخدام رابط إدارة الحجز الذي يظهر بعد حفظ الطلب."],
 ["هل أحتاج إلى الدفع عند الحجز؟", "لا يوجد دفع إلكتروني في هذه النسخة. يمكنك تجربة اختيار الخدمة والموعد وحفظ الطلب. الموقع تجريبي، ولا تُرسل الطلبات إلى مركز عناية فعلي."],
];

function getAccess(): Access[] {
 try {
  const value = JSON.parse(localStorage.getItem("lamaa-booking-access") || "[]");
  return Array.isArray(value) ? value.filter(x => x && /^LM-[A-F0-9]{8}$/.test(x.reference) && /^[a-f0-9]{64}$/.test(x.token)).slice(0, 20) : [];
 } catch { return []; }
}
function saveAccess(access: Access) {
 try { localStorage.setItem("lamaa-booking-access", JSON.stringify([access, ...getAccess().filter(x => x.reference !== access.reference)].slice(0, 20))); } catch { /* The management link is always available in the receipt. */ }
}
function downloadReceipt(booking: Booking, access: Access) {
 const service = services.find(s => s.id === booking.service)!;
 const link = location.origin + "/#manage=" + access.reference + "." + access.token;
 const receipt = ["لمعة — تفاصيل طلب تجريبي", booking.reference, service.name, booking.model, dateLabel(booking.day), timeLabel(booking.hour) + " بتوقيت الرياض", money(booking.total) + " ر.س", "الحالة: " + (booking.status === "cancelled" ? "ملغي" : "بانتظار التأكيد"), "رابط إدارة خاص — لا تشاركه مع الآخرين:", link, "هذا طلب تجريبي، ولا يُرسل إلى مركز فعلي."].join("\n");
 const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
 const a = document.createElement("a"); a.href = url; a.download = booking.reference + ".txt"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Brand({ light = false }: { light?: boolean }) {
 return <a href="#" className={"brand" + (light ? " light" : "")} aria-label="لمعة — الرئيسية"><img src="/images/logo.webp" width="94" height="48" alt="" /><span className="brand-name">لمعة<span>عناية في كل تفصيلة</span></span></a>;
}

export default function DetailingSite() {
 const [mobile, setMobile] = useState(false);
 const [service, setService] = useState<ServiceId>("signature");
 const [vehicle, setVehicle] = useState<VehicleId>("sedan");
 const [day, setDay] = useState("");
 const [bookingOpen, setBookingOpen] = useState(false);
 const [manageOpen, setManageOpen] = useState(false);
 const [incoming, setIncoming] = useState<Access | null>(null);
 const [privacy, setPrivacy] = useState(false);
 useEffect(() => {
  setDay(dateKey(1));
  const sync = () => {
   if (location.hash === "#booking") setBookingOpen(true);
   if (location.hash.startsWith("#manage=")) {
    const [reference, token] = location.hash.slice(8).split(".");
    if (/^LM-[A-F0-9]{8}$/.test(reference) && /^[a-f0-9]{64}$/.test(token)) { setIncoming({ reference, token }); setManageOpen(true); }
   }
  };
  sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync);
 }, []);
 const openBooking = (id?: ServiceId) => { if (id) setService(id); setMobile(false); setBookingOpen(true); history.replaceState(null, "", "#booking"); };
 const closeBooking = () => { setBookingOpen(false); if (location.hash === "#booking") history.replaceState(null, "", location.pathname); };
 const closeManage = () => { setManageOpen(false); setIncoming(null); if (location.hash.startsWith("#manage=")) history.replaceState(null, "", location.pathname); };
 return <>
  <a href="#main" className="skip-link">انتقل إلى المحتوى</a>
  <header className="site-header">
   <div className="container header-inner"><Brand />
    <nav aria-label="التنقل الرئيسي" className={mobile ? "nav-links open" : "nav-links"}>
     <a href="#services" onClick={() => setMobile(false)}>خدماتنا</a>
     <a href="#experience" onClick={() => setMobile(false)}>تجربة لمعة</a>
     <a href="#questions" onClick={() => setMobile(false)}>الأسئلة الشائعة</a>
     <button onClick={() => { setManageOpen(true); setMobile(false); }}>حجوزاتي</button>
    </nav>
    <button className="button primary header-book" onClick={() => openBooking()}>احجز موعدك <ArrowUpLeft size={18} aria-hidden="true" /></button>
    <button className="menu-button icon-button" aria-label={mobile ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
   </div>
  </header>
  <main id="main">
   <section className="hero" aria-labelledby="hero-heading">
    <img className="hero-photo" src="/images/hero.webp" width="1776" height="888" alt="سيارة بطلاء لامع داخل استوديو عناية بالسيارات" fetchPriority="high" />
    <div className="hero-shade" />
    <div className="container hero-content">
     <div className="hero-copy"><div className="hero-intro"><span className="tiny-shine">✧</span> عناية تليق بسيارتك</div>
      <h1 id="hero-heading">رجّع إحساس<br />أول يوم.</h1>
      <p>من أول غسلة لآخر لمعة، نهتم بكل تفصيلة.<br className="desktop-break" /> اختر عناية سيارتك… واترك الباقي لنا.</p>
      <div className="hero-actions"><button className="button champagne" onClick={() => openBooking()}>احجز وقتًا لسيارتك <ArrowUpLeft size={21} aria-hidden="true" /></button><a href="#services" className="hero-link">اكتشف الخدمات <ArrowLeft size={18} aria-hidden="true" /></a></div>
      <div className="hero-note"><ShieldCheck size={17} aria-hidden="true" /><span>عناية دقيقة. سعر واضح. موعد يناسبك.</span></div>
     </div>
     <div className="image-caption" aria-hidden="true"><span className="caption-line" /><span>الجمال في التفاصيل</span><span className="caption-en">The art of detailing</span></div>
    </div>
   </section>

   <div className="container quick-book-wrap">
    <form className="quick-book" onSubmit={e => { e.preventDefault(); openBooking(); }}>
     <div className="quick-intro"><CalendarDays size={26} aria-hidden="true" /><div><strong>سيارتك تستاهل.</strong><span>ابدأ حجزك من هنا</span></div></div>
     <label className="quick-field"><span>الخدمة</span><select value={service} onChange={e => setService(e.target.value as ServiceId)}>{services.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
     <label className="quick-field"><span>نوع السيارة</span><select value={vehicle} onChange={e => setVehicle(e.target.value as VehicleId)}>{vehicles.map(v => <option value={v.id} key={v.id}>{v.name}</option>)}</select></label>
     <label className="quick-field date-field"><span>التاريخ المناسب</span><input type="date" required value={day} min={dateKey()} max={dateKey(60)} onChange={e => setDay(e.target.value)} /></label>
     <button className="button primary quick-submit" type="submit">اختر موعدك <ArrowLeft size={19} aria-hidden="true" /></button>
    </form>
   </div>

   <div className="container assurance-strip">
    <div><ShieldCheck aria-hidden="true" /><span><strong>عناية حسب احتياجك</strong><small>باقة مناسبة لكل سيارة</small></span></div>
    <div><Wallet aria-hidden="true" /><span><strong>السعر واضح من البداية</strong><small>اعرف الإجمالي قبل الحجز</small></span></div>
    <div><CalendarCheck aria-hidden="true" /><span><strong>وقتك له قيمة</strong><small>اختر موعدك بخطوات بسيطة</small></span></div>
   </div>

   <section className="services-section section" id="services" aria-labelledby="services-heading">
    <div className="container">
     <div className="section-heading"><div><p className="section-kicker">لكل سيارة عنايتها</p><h2 id="services-heading">اختر اللمعة المناسبة لك.</h2></div><p className="heading-description">نظافة يومية، عناية متكاملة، أو حماية تدوم.<br />ثلاث باقات، واهتمام واحد بكل التفاصيل.</p></div>
     <div className="service-grid">{services.map((s, i) => { const Icon = serviceIcons[i]; return <article className={"service-card" + (i === 1 ? " featured" : "")} key={s.id}>
      <div className="service-top"><div className="service-icon"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /></div>{i === 1 && <span className="recommend-badge">عناية شاملة</span>}<span className="service-duration"><Clock3 size={14} aria-hidden="true" />{s.duration}</span></div>
      <h3>{s.name}</h3><p className="service-subtitle">{s.subtitle}</p>
      <div className="price"><span className="price-from">ابتداءً من</span><div><strong>{money(s.price)}</strong><span>ر.س <small>/ للسيارة</small></span></div></div>
      <div className="service-divider" />
      <ul>{s.features.map(f => <li key={f}><Check size={17} aria-hidden="true" />{f}</li>)}</ul>
      <button className={"button full " + (i === 1 ? "champagne" : "outline")} onClick={() => openBooking(s.id)}>احجز هذه الباقة <ArrowUpLeft size={18} aria-hidden="true" /></button>
     </article>; })}</div>
     <p className="pricing-note">الأسعار التجريبية للسيدان وشاملة الضريبة. يظهر فرق حجم السيارة قبل حفظ الطلب.</p>
    </div>
   </section>

   <section className="experience-section section" id="experience" aria-labelledby="experience-heading">
    <div className="container experience-grid">
     <div className="experience-image"><img src="/images/detailing.webp" alt="تلميع دقيق لطلاء سيارة باستخدام آلة تلميع وقطعة ناعمة" width="1536" height="1024" loading="lazy" /><div className="photo-label"><Sparkles size={22} aria-hidden="true" /><span>فرق تشوفه.<br /><strong>وعناية تحسّها.</strong></span></div></div>
     <div className="experience-copy"><p className="section-kicker">تجربة لمعة</p><h2 id="experience-heading">مو بس نظافة.<br />اهتمام من أول تفصيلة.</h2><p className="experience-description">سيارتك جزء من يومك. عشان كذا، صممنا تجربة عناية تبدأ باختيار بسيط وتنتهي بإحساس مختلف خلف المقود.</p>
      <div className="process-item"><span>١</span><div><h3>اختر عنايتك</h3><p>حدد الباقة وحجم سيارتك، واعرف السعر مباشرة.</p></div></div>
      <div className="process-item"><span>٢</span><div><h3>خلّ لنا وقتًا</h3><p>اختر اليوم والوقت المناسبين من المواعيد المتاحة.</p></div></div>
      <div className="process-item"><span>٣</span><div><h3>كل التفاصيل بين يديك</h3><p>احفظ رقم طلبك، وراجع موعدك أو ألغِه بسهولة.</p></div></div>
      <button className="text-button" onClick={() => openBooking()}>ابدأ تجربة لمعة <ArrowLeft size={19} aria-hidden="true" /></button>
     </div>
    </div>
   </section>

   <section className="faq-section section" id="questions" aria-labelledby="faq-heading"><div className="container faq-grid"><div><p className="section-kicker">قبل موعدك</p><h2 id="faq-heading">كل اللي<br />في بالك.</h2><p>تفاصيل صغيرة تساعدك تختار<br />العناية المناسبة وأنت مطمئن.</p><span className="faq-art" aria-hidden="true"><Sparkles size={76} strokeWidth={0.8} /></span></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className="faq-plus" aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>

   <section className="container final-cta"><div><span className="cta-star" aria-hidden="true">✧</span><div><h2>لأن كل طريق يبدأ بلمعة.</h2><p>خلّ العناية علينا، واستمتع بالطريق.</p></div></div><button className="button champagne" onClick={() => openBooking()}>احجز موعدك الآن <ArrowUpLeft size={20} aria-hidden="true" /></button></section>
  </main>
  <footer className="footer"><div className="container footer-main"><Brand /><p>عناية لسيارتك، وراحة لبالك.</p><div><a href="#services">الخدمات</a><button onClick={() => setManageOpen(true)}>حجوزاتي</button><button onClick={() => setPrivacy(true)}>الخصوصية</button></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} لمعة. عناية في كل تفصيلة.</span><span>نسخة تجريبية · المحتوى والأسعار توضيحية، والحجوزات لا تُرسل إلى مركز فعلي.</span></div></footer>
  {bookingOpen && <BookingDialog initialService={service} initialVehicle={vehicle} initialDay={day || dateKey(1)} onClose={closeBooking} />}
  {manageOpen && <ManageDialog incoming={incoming} onClose={closeManage} />}
  {privacy && <InfoDialog onClose={() => setPrivacy(false)} />}
 </>;
}

function Modal({ title, onClose, children, className = "" }: { title: string; onClose: () => void; children: React.ReactNode; className?: string }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(() => {
  const dialog = ref.current!; dialog.showModal();
  const original = document.body.style.overflow; document.body.style.overflow = "hidden";
  return () => { dialog.close(); document.body.style.overflow = original; };
 }, []);
 function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(el => el.offsetParent !== null);
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (!first) { event.preventDefault(); return; }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
 }
 return <dialog onKeyDown={trapFocus} ref={ref} className={"dialog " + className} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}><div className="dialog-top"><span className="dialog-brand"><Sparkles size={19} aria-hidden="true" /> لمعة</span><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={21} /></button></div>{children}</dialog>;
}

function BookingDialog({ initialService, initialVehicle, initialDay, onClose }: { initialService: ServiceId; initialVehicle: VehicleId; initialDay: string; onClose: () => void }) {
 const [step, setStep] = useState(0), [service, setService] = useState(initialService), [vehicle, setVehicle] = useState(initialVehicle), [day, setDay] = useState(initialDay), [hour, setHour] = useState<number | null>(null);
 const [slots, setSlots] = useState<{ hour: number; available: boolean }[]>([]), [loading, setLoading] = useState(false), [error, setError] = useState(""), [refresh, setRefresh] = useState(0), [sending, setSending] = useState(false);
 const [name, setName] = useState(""), [phone, setPhone] = useState(""), [model, setModel] = useState(""), [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
 const [booking, setBooking] = useState<Booking | null>(null);
 const identity = useRef<{ id: string; token: string } | null>(null);
 const heading = useRef<HTMLHeadingElement>(null);
 const selectedService = services.find(s => s.id === service)!;
 const selectedVehicle = vehicles.find(v => v.id === vehicle)!;
 useEffect(() => { heading.current?.focus(); }, [step, booking]);
 useEffect(() => {
  if (step !== 1) return;
  const controller = new AbortController(); setLoading(true); setSlots([]); setHour(null);
  fetch("/api/availability?date=" + day + "&service=" + service, { signal: controller.signal }).then(async r => { const d = await readResponse(r); if (!r.ok) throw new Error(d.error); return d; })
   .then(d => setSlots(d.slots)).catch(e => { if (e.name !== "AbortError") setError(e.message || "تعذّر تحميل المواعيد."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [day, service, step, refresh]);
 function next() {
  setError("");
  if (step === 1 && hour === null) { setError("اختر أحد المواعيد المتاحة للمتابعة."); return; }
  setStep(step + 1);
 }
 async function submit(e: FormEvent) {
  e.preventDefault(); if (sending) return;
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) errors.name = "اكتب اسمًا من حرفين على الأقل.";
  if (!/^(05\d{8}|\+9665\d{8}|009665\d{8})$/.test(phone.replace(/[\s()-]/g, ""))) errors.phone = "اكتب رقم جوال سعودي مثل 0501234567.";
  if (model.trim().length < 2) errors.model = "اكتب ماركة السيارة والموديل.";
  setFieldErrors(errors); setError("");
  if (Object.keys(errors).length) { document.getElementById(Object.keys(errors)[0])?.focus(); return; }
  if (!identity.current) identity.current = { id: crypto.randomUUID(), token: [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, "0")).join("") };
  setSending(true);
  try {
   const r = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...identity.current, name, phone, model, service, vehicle, day, hour }) });
   const data = await readResponse(r);
   if (!r.ok) { if (r.status === 409) { setStep(1); setRefresh(n => n + 1); } throw new Error(data.error); }
   saveAccess({ reference: data.booking.reference, token: identity.current.token }); setBooking(data.booking);
  } catch (e) { setError(e instanceof Error ? e.message : "تعذّر الاتصال. حاول مرة أخرى."); }
  finally { setSending(false); }
 }
 return <Modal title="حجز موعد عناية" onClose={onClose} className="booking-dialog">
  {booking ? <div className="success-view"><span className="success-icon"><CircleCheck size={35} /></span><h2 ref={heading} tabIndex={-1}>تم حفظ طلبك.</h2><p>كل تفاصيل عناية سيارتك في مكان واحد.</p><BookingSummary booking={booking} />
   <p className="demo-notice">طلب تجريبي محفوظ للمعاينة فقط. لم يتم تأكيد موعد مع مركز فعلي أو إرسال رسائل.</p>
   <button className="button primary full" onClick={() => downloadReceipt(booking, { reference: booking.reference, token: identity.current!.token })}><Download size={18} /> تحميل تفاصيل الطلب ورابط إدارته</button>
   <button className="text-button centered" onClick={onClose}>العودة للرئيسية</button></div> : <>
   <div className="booking-heading"><h2 ref={heading} tabIndex={-1}>{["عناية على مقاس سيارتك.", "اختر وقتًا يناسبك.", "باقي تفاصيل بسيطة."][step]}</h2><p>{["ابدأ بالخدمة وحجم السيارة.", "المواعيد بتوقيت الرياض. نخصص الوقت الكامل لباقتك.", "راجع طلبك وأضف بيانات التواصل."][step]}</p></div>
   <ol className="steps">{["الخدمة والسيارة", "الموعد", "بياناتك"].map((label, i) => <li key={label} className={i === step ? "active" : i < step ? "complete" : ""} aria-current={i === step ? "step" : undefined}><span>{i < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span>{label}</li>)}</ol>
   <form onSubmit={submit} noValidate>
    <div className="step-content">
     {step === 0 && <><fieldset><legend>اختر باقة العناية</legend><div className="service-options">{services.map(s => <label key={s.id} className={"choice-card " + (service === s.id ? "selected" : "")}><input type="radio" name="service" value={s.id} checked={service === s.id} onChange={() => { setService(s.id); setHour(null); }} /><span><strong>{s.name}</strong><small>{s.duration}</small></span><b>{money(s.price)} <small>ر.س</small></b></label>)}</div></fieldset><fieldset><legend>حجم سيارتك</legend><div className="vehicle-options">{vehicles.map(v => <label key={v.id} className={"vehicle-choice " + (vehicle === v.id ? "selected" : "")}><input type="radio" name="vehicle" checked={vehicle === v.id} onChange={() => setVehicle(v.id)} /><CarFront size={30} strokeWidth={1.3} aria-hidden="true" /><strong>{v.name}</strong><small>{v.extra ? "+" + v.extra + " ر.س" : "السعر الأساسي"}</small></label>)}</div></fieldset></>}
     {step === 1 && <><fieldset><legend>اليوم المناسب</legend><div className="date-options">{Array.from({ length: 6 }, (_, i) => dateKey(i + 1)).map(d => <button type="button" key={d} className={"date-option " + (d === day ? "selected" : "")} aria-pressed={d === day} onClick={() => setDay(d)}><span>{new Intl.DateTimeFormat("ar-SA", { weekday: "short" }).format(new Date(d + "T12:00:00"))}</span><strong>{Number(d.slice(-2))}</strong><small>{new Intl.DateTimeFormat("ar-SA", { month: "short", calendar: "gregory" }).format(new Date(d + "T12:00:00"))}</small></button>)}</div><label className="other-date">أو اختر تاريخًا آخر<input aria-label="تاريخ الموعد" type="date" min={dateKey()} max={dateKey(60)} value={day} onChange={e => e.target.value && setDay(e.target.value)} /></label></fieldset><fieldset><legend>الوقت المتاح <span className="legend-note">مدة الخدمة: {selectedService.duration}</span></legend>{loading ? <div role="status" className="loading-state"><RefreshCw className="spin" size={20} /> جاري تحميل المواعيد…</div> : <div className="time-options">{slots.map(s => <button type="button" key={s.hour} disabled={!s.available} aria-pressed={hour === s.hour} className={hour === s.hour ? "selected" : ""} onClick={() => { setHour(s.hour); setError(""); }}>{timeLabel(s.hour)}{!s.available && <small>غير متاح</small>}</button>)}</div>}{!loading && slots.length > 0 && !slots.some(s => s.available) && <p className="empty-note">لا توجد مواعيد تكفي لهذه الباقة في هذا اليوم. اختر يومًا آخر.</p>}{!loading && !slots.length && <button type="button" className="text-button" onClick={() => { setError(""); setRefresh(n => n + 1); }}>إعادة تحميل المواعيد <RefreshCw size={16} /></button>}</fieldset></>}
     {step === 2 && <><div className="review-strip"><CalendarDays size={23} aria-hidden="true" /><div><strong>{dateLabel(day)}</strong><span>{timeLabel(hour!)} · {selectedService.name} · {selectedVehicle.name}</span></div><button type="button" onClick={() => setStep(1)}>تعديل</button></div><div className="contact-fields">
      <label htmlFor="name">الاسم الكامل<input id="name" autoComplete="name" maxLength={80} value={name} onChange={e => setName(e.target.value)} onBlur={() => { if (name.trim().length >= 2) setFieldErrors(e => ({ ...e, name: "" })); }} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-error" : undefined} placeholder="اكتب اسمك" required />{fieldErrors.name && <small className="field-error" id="name-error">{fieldErrors.name}</small>}</label>
      <label htmlFor="phone">رقم الجوال<input id="phone" type="tel" dir="ltr" autoComplete="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => { if (/^(05\d{8}|\+9665\d{8}|009665\d{8})$/.test(phone.replace(/[\s()-]/g, ""))) setFieldErrors(e => ({ ...e, phone: "" })); }} aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} placeholder="05xxxxxxxx" required />{fieldErrors.phone && <small className="field-error" id="phone-error">{fieldErrors.phone}</small>}</label>
      <label htmlFor="model" className="full-field">ماركة السيارة والموديل<input id="model" maxLength={80} value={model} onChange={e => setModel(e.target.value)} onBlur={() => { if (model.trim().length >= 2) setFieldErrors(e => ({ ...e, model: "" })); }} aria-invalid={!!fieldErrors.model} aria-describedby={fieldErrors.model ? "model-error" : undefined} placeholder="مثال: تويوتا كامري 2024" required />{fieldErrors.model && <small className="field-error" id="model-error">{fieldErrors.model}</small>}</label>
     </div><p className="demo-notice">هذه تجربة للموقع. سيُحفظ الطلب دون إرساله إلى مركز فعلي أو تحصيل أي مبلغ. تُستخدم بياناتك لعرض طلبك فقط.</p></>}
     {error && <p role="alert" className="form-error">{error}</p>}
    </div>
    <div className="booking-bottom"><div className="booking-total"><span>الإجمالي شامل الضريبة</span><strong>{money(selectedService.price + selectedVehicle.extra)} <small>ر.س</small></strong></div><div className="step-buttons">{step > 0 && <button className="button back-button" type="button" disabled={sending} onClick={() => { setError(""); setStep(step - 1); }}>رجوع</button>}{step < 2 ? <button className="button primary" type="button" onClick={next} disabled={step === 1 && (loading || hour === null)}>متابعة <ArrowLeft size={18} /></button> : <button className="button primary" type="submit" disabled={sending}>{sending ? "جاري حفظ الطلب…" : "احفظ طلب الحجز"}{!sending && <Check size={18} />}</button>}</div></div>
   </form>
  </>}
 </Modal>;
}

function BookingSummary({ booking }: { booking: Booking }) {
 return <div className="booking-summary"><div className="summary-head"><b dir="ltr">{booking.reference}</b><span className={booking.status === "cancelled" ? "status cancelled" : "status"}>{booking.status === "cancelled" ? "ملغي" : "بانتظار التأكيد"}</span></div><dl><div><dt>الخدمة</dt><dd>{services.find(s => s.id === booking.service)?.name}</dd></div><div><dt>السيارة</dt><dd>{booking.model}</dd></div><div><dt>الموعد</dt><dd>{dateLabel(booking.day)}، {timeLabel(booking.hour)}</dd></div><div><dt>الإجمالي</dt><dd>{money(booking.total)} ر.س</dd></div></dl></div>;
}
function ManageDialog({ incoming, onClose }: { incoming: Access | null; onClose: () => void }) {
 const [entries, setEntries] = useState<{ booking: Booking; access: Access }[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [confirmCancel, setConfirmCancel] = useState(""), [busy, setBusy] = useState(""), [attempt, setAttempt] = useState(0);
 useEffect(() => {
  let active = true; setLoading(true); setError("");
  const accessList = incoming ? [incoming] : getAccess();
  Promise.all(accessList.map(async access => {
   const r = await fetch("/api/bookings/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(access) }); const d = await readResponse(r);
   if (!r.ok) throw new Error(d.error); return { booking: d.booking as Booking, access };
  })).then(data => { if (active) setEntries(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [incoming, attempt]);
 async function cancel(entry: { booking: Booking; access: Access }) {
  setBusy(entry.booking.reference); setError("");
  try {
   const r = await fetch("/api/bookings/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entry.access, action: "cancel" }) }); const d = await readResponse(r);
   if (!r.ok) throw new Error(d.error);
   setEntries(items => items.map(x => x.booking.reference === d.booking.reference ? { ...x, booking: d.booking } : x)); setConfirmCancel("");
  } catch (e) { setError(e instanceof Error ? e.message : "تعذّر إلغاء الطلب."); } finally { setBusy(""); }
 }
 return <Modal title="حجوزاتي" onClose={onClose}><div className="manage-content"><h2>حجوزاتي</h2><p className="muted">تفاصيل طلباتك وروابط إدارتها، في مكان واحد.</p>{loading && <p role="status" className="loading-state"><RefreshCw className="spin" size={20} /> جاري تحميل الحجوزات…</p>}{error && <div role="alert" className="form-error">{error}<button className="text-button" onClick={() => setAttempt(n => n + 1)}>حاول مرة أخرى</button></div>}{!loading && !error && !entries.length && <div className="empty-bookings"><CalendarDays size={44} strokeWidth={1.2} /><h3>موعدك الأول يبدأ من هنا.</h3><p>لم تحفظ أي طلب على هذا الجهاز بعد.<br />اختر باقتك وسنحفظ تفاصيلها لك.</p><button className="button primary" onClick={() => { onClose(); location.hash = "booking"; }}>احجز موعدك</button></div>}{entries.map(entry => <div className="managed-booking" key={entry.booking.reference}><BookingSummary booking={entry.booking} /><div className="manage-actions"><button className="text-button" onClick={() => downloadReceipt(entry.booking, entry.access)}><Download size={16} /> تحميل التفاصيل</button>{entry.booking.status !== "cancelled" && <button className="cancel-link" disabled={!!busy} onClick={() => setConfirmCancel(entry.booking.reference)}>إلغاء الطلب</button>}</div>{confirmCancel === entry.booking.reference && <div className="cancel-confirm"><p>هل تريد إلغاء هذا الطلب وإتاحة الموعد من جديد؟</p><div><button className="button danger" disabled={!!busy} onClick={() => cancel(entry)}>{busy ? "جاري الإلغاء…" : "نعم، ألغِ الطلب"}</button><button className="button outline" onClick={() => setConfirmCancel("")} disabled={!!busy}>الاحتفاظ بالطلب</button></div></div>}</div>)}</div></Modal>;
}
function InfoDialog({ onClose }: { onClose: () => void }) {
 return <Modal title="الخصوصية" onClose={onClose}><div className="manage-content"><h2>خصوصيتك في لمعة</h2><p>هذه نسخة تجريبية خاصة. تُحفظ بيانات الاسم والجوال والسيارة والموعد في قاعدة بيانات الموقع لعرض طلبك وإدارته، ولا تُرسل إلى مركز فعلي أو جهة خارجية للتسويق.</p><p>يُحفظ مفتاح الوصول إلى الحجز على جهازك. رابط إدارة الحجز خاص؛ احتفظ به ولا تشاركه مع الآخرين. مسح بيانات المتصفح يزيل اختصار «حجوزاتي»، ويمكنك استخدام الرابط الذي حمّلته للوصول إلى الطلب.</p><p>إلغاء الطلب يحرر الموعد ويغيّر حالته إلى ملغي، لكنه لا يحذف سجله. لم تُفعّل مدفوعات أو رسائل SMS أو أدوات تتبع إعلانية في هذا الموقع.</p><button className="button primary" onClick={onClose}>فهمت</button></div></Modal>;
}
