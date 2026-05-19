'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfToday, isWeekend, parseISO, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Waves, CheckCircle, Loader2, CreditCard, FileText, Upload, Camera, Anchor, ShieldCheck, Shield } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import SignaturePad from './SignaturePad';
import WaiverText from './WaiverText';
import SafetyBriefingText from './SafetyBriefingText';
import LiveryWaiverText from './LiveryWaiverText';
import FWCAttestationChecklist from './FWCAttestationChecklist';
import VideoRecorder from './VideoRecorder';

interface ProtectionTier {
  id: string;
  name: string;
  price: number;
  deductible: number;
  color: string;
  description: string;
}

const PROTECTION_TIERS: ProtectionTier[] = [
  { id: 'none', name: 'No Coverage', price: 0, deductible: 0, color: 'gray', description: '$300 security deposit hold per jet ski' },
  { id: 'silver', name: 'Silver', price: 50, deductible: 2000, color: 'slate', description: 'Basic damage protection' },
  { id: 'gold', name: 'Gold', price: 100, deductible: 1500, color: 'amber', description: 'Enhanced damage protection' },
  { id: 'platinum', name: 'Platinum', price: 200, deductible: 1000, color: 'purple', description: 'Premium damage protection' },
];

const LIABILITY_STATEMENT = "My name is _______. Today is _______. I am voluntarily renting and operating this jet ski. I confirm I received the safety briefing, understand the risks of injury or death, and will follow all rules and Florida boating laws. I accept full responsibility for myself and my passengers, assume all risks, and release the rental company and its employees from liability.";

interface TimeSlot {
  id: string;
  label: string;
  durationMinutes: number;
  weekdayPrice: number;
  weekendPrice: number;
}

interface JetSki {
  id: string;
  name: string;
  description: string;
  status: string;
}

type Step = 'date' | 'duration' | 'jetski' | 'time' | 'details' | 'waiver' | 'safety' | 'fwc' | 'adddriver' | 'protection' | 'deposit' | 'confirm' | 'success';

interface DriverWaiver {
  driverName: string;
  dob: string;
  address: string;
  licenseId: string;
  signature: string;
  idPhoto: string;
  idPhotoFile: File | null;
  boaterIdPhoto: string;
  boaterIdPhotoFile: File | null;
  liabilityVideo: string;
  videoBlob: Blob | null;
  photoOptOut: boolean;
  isMinor: boolean;
  minorName: string;
  minorAge: string;
  guardianSignature: string;
  guardianName: string;
  safetySignature: string;
  safetyScrolled: boolean;
  fwcComplete: boolean;
  fwcSignature: string;
  waiverScrolled: boolean;
}

export default function BookingWizard({ isGroupon = false, waiverOnly = false }: { isGroupon?: boolean; waiverOnly?: boolean }) {
  const [step, setStep] = useState<Step>(waiverOnly ? 'details' : 'date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedJetSki, setSelectedJetSki] = useState<JetSki | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [jetSkis, setJetSkis] = useState<JetSki[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ id: string; date: string; startTime: string; totalPrice: number } | null>(null);
  const [error, setError] = useState('');

  // Waiver state
  const [waiverDOB, setWaiverDOB] = useState('');
  const [waiverAddress, setWaiverAddress] = useState('');
  const [waiverLicenseId, setWaiverLicenseId] = useState('');
  const [waiverSignature, setWaiverSignature] = useState('');
  const [waiverIdPhoto, setWaiverIdPhoto] = useState('');
  const [waiverIdPhotoFile, setWaiverIdPhotoFile] = useState<File | null>(null);
  const [waiverPhotoOptOut, setWaiverPhotoOptOut] = useState(false);
  const [waiverIsMinor, setWaiverIsMinor] = useState(false);
  const [waiverMinorName, setWaiverMinorName] = useState('');
  const [waiverMinorAge, setWaiverMinorAge] = useState('');
  const [waiverGuardianSignature, setWaiverGuardianSignature] = useState('');
  const [waiverGuardianName, setWaiverGuardianName] = useState('');
  const [waiverBoaterIdPhoto, setWaiverBoaterIdPhoto] = useState('');
  const [waiverBoaterIdPhotoFile, setWaiverBoaterIdPhotoFile] = useState<File | null>(null);
  const [waiverLiabilityVideo, setWaiverLiabilityVideo] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [waiverScrolledToBottom, setWaiverScrolledToBottom] = useState(false);
  const waiverScrollRef = useRef<HTMLDivElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const boaterIdInputRef = useRef<HTMLInputElement>(null);

  // Safety briefing state
  const [safetyScrolledToBottom, setSafetyScrolledToBottom] = useState(false);
  const [safetySignature, setSafetySignature] = useState('');
  const safetyScrollRef = useRef<HTMLDivElement>(null);

  // FWC attestation state
  const [fwcComplete, setFwcComplete] = useState(false);
  const [fwcSignature, setFwcSignature] = useState('');

  // Protection tier state
  const [selectedProtection, setSelectedProtection] = useState<string>('');

  // Additional driver state
  const [additionalDrivers, setAdditionalDrivers] = useState<DriverWaiver[]>([]);
  const [isDriverWaiverMode, setIsDriverWaiverMode] = useState(false);
  const [driverName, setDriverName] = useState('');

  // Deposit / livery waiver state (only shown if no insurance selected)
  const [depositScrolledToBottom, setDepositScrolledToBottom] = useState(false);
  const [depositSignature, setDepositSignature] = useState('');
  const depositScrollRef = useRef<HTMLDivElement>(null);

  // Clear error when navigating between steps
  useEffect(() => {
    setError('');
  }, [step]);

  // Load inventory data
  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        setTimeSlots(data.timeSlots);
        setJetSkis(data.jetSkis.filter((js: JetSki) => js.status === 'available'));
      })
      .catch(() => {});
  }, []);

  // Both jet skis option
  const [selectBoth, setSelectBoth] = useState(false);

  // Load available times when jet ski, date, and slot are selected
  useEffect(() => {
    if (!selectedDate || !selectedSlot) return;
    if (!selectBoth && !selectedJetSki) return;
    setLoading(true);
    const jetSkiParam = selectBoth ? 'both' : selectedJetSki!.id;
    const tzOffset = new Date().getTimezoneOffset();
    fetch(`/api/bookings?date=${selectedDate}&jetSkiId=${jetSkiParam}&timeSlotId=${selectedSlot.id}&tzOffset=${tzOffset}&_t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        let times: string[] = data.availableTimes || [];
        // Filter out past times if booking for today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (selectedDate === todayStr) {
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          times = times.filter(t => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m > nowMinutes;
          });
        }
        setAvailableTimes(times);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, selectedJetSki, selectedSlot, selectBoth]);

  const getPrice = () => {
    if (!selectedSlot || !selectedDate) return 0;
    const base = isWeekend(parseISO(selectedDate)) ? selectedSlot.weekendPrice : selectedSlot.weekdayPrice;
    return selectBoth ? base * 2 : base;
  };

  // Compress image to max ~800px wide, JPEG quality 0.6 (~50-150KB output)
  const compressImage = (file: File, callback: (dataUrl: string) => void) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          callback(canvas.toDataURL('image/jpeg', 0.6));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleIdPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWaiverIdPhotoFile(file);
    compressImage(file, (dataUrl) => setWaiverIdPhoto(dataUrl));
  };

  const handleBoaterIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWaiverBoaterIdPhotoFile(file);
    compressImage(file, (dataUrl) => setWaiverBoaterIdPhoto(dataUrl));
  };

  const handleWaiverScroll = () => {
    const el = waiverScrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setWaiverScrolledToBottom(true);
    }
  };

  const handleSafetyScroll = () => {
    const el = safetyScrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setSafetyScrolledToBottom(true);
    }
  };

  const handleDepositScroll = () => {
    const el = depositScrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setDepositScrolledToBottom(true);
    }
  };

  const getJetSkiCount = () => selectBoth ? jetSkis.length : 1;

  const getDepositTotal = () => 300 * getJetSkiCount();

  const getProtectionPrice = () => {
    const tier = PROTECTION_TIERS.find(t => t.id === selectedProtection);
    if (!tier || tier.id === 'none') return 0;
    return tier.price * getJetSkiCount();
  };

  const getTotalWithProtection = () => getPrice() + getProtectionPrice();

  const isWaiverComplete = () => {
    const base = waiverDOB && waiverAddress && waiverLicenseId && waiverSignature && waiverIdPhoto && waiverBoaterIdPhoto && waiverLiabilityVideo;
    if (waiverIsMinor) {
      return base && waiverMinorName && waiverMinorAge && waiverGuardianSignature && waiverGuardianName;
    }
    return base;
  };

  const resetWaiverFields = () => {
    setWaiverDOB('');
    setWaiverAddress('');
    setWaiverLicenseId('');
    setWaiverSignature('');
    setWaiverIdPhoto('');
    setWaiverIdPhotoFile(null);
    setWaiverBoaterIdPhoto('');
    setWaiverBoaterIdPhotoFile(null);
    setWaiverLiabilityVideo('');
    setVideoBlob(null);
    setWaiverPhotoOptOut(false);
    setWaiverIsMinor(false);
    setWaiverMinorName('');
    setWaiverMinorAge('');
    setWaiverGuardianSignature('');
    setWaiverGuardianName('');
    setWaiverScrolledToBottom(false);
    setSafetyScrolledToBottom(false);
    setSafetySignature('');
    setFwcComplete(false);
    setFwcSignature('');
    setDriverName('');
    if (idInputRef.current) idInputRef.current.value = '';
    if (boaterIdInputRef.current) boaterIdInputRef.current.value = '';
  };

  const saveCurrentDriverWaiver = () => {
    const driver: DriverWaiver = {
      driverName,
      dob: waiverDOB,
      address: waiverAddress,
      licenseId: waiverLicenseId,
      signature: waiverSignature,
      idPhoto: waiverIdPhoto,
      idPhotoFile: waiverIdPhotoFile,
      boaterIdPhoto: waiverBoaterIdPhoto,
      boaterIdPhotoFile: waiverBoaterIdPhotoFile,
      liabilityVideo: waiverLiabilityVideo,
      videoBlob,
      photoOptOut: waiverPhotoOptOut,
      isMinor: waiverIsMinor,
      minorName: waiverMinorName,
      minorAge: waiverMinorAge,
      guardianSignature: waiverGuardianSignature,
      guardianName: waiverGuardianName,
      safetySignature,
      safetyScrolled: safetyScrolledToBottom,
      fwcComplete,
      fwcSignature,
      waiverScrolled: waiverScrolledToBottom,
    };
    setAdditionalDrivers(prev => [...prev, driver]);
    resetWaiverFields();
  };

  const startAddDriver = () => {
    resetWaiverFields();
    setIsDriverWaiverMode(true);
    setWaiverScrolledToBottom(false);
    setStep('waiver');
  };

  const uploadDriverFiles = async (driver: DriverWaiver, bookingId: string, driverNum: number) => {
    const prefix = `driver-${driverNum}`;
    const idPath = driver.idPhotoFile ? await uploadFileToStorage(driver.idPhotoFile, `${prefix}/id-photo`, bookingId) : null;
    const boaterPath = driver.boaterIdPhotoFile ? await uploadFileToStorage(driver.boaterIdPhotoFile, `${prefix}/boater-id`, bookingId) : null;
    const sigPath = driver.signature ? await uploadDataUrlToStorage(driver.signature, `${prefix}/signature`, bookingId) : null;
    const safetySigPath = driver.safetySignature ? await uploadDataUrlToStorage(driver.safetySignature, `${prefix}/safety-signature`, bookingId) : null;
    let guardianSigPath: string | null = null;
    if (driver.isMinor && driver.guardianSignature) {
      guardianSigPath = await uploadDataUrlToStorage(driver.guardianSignature, `${prefix}/guardian-signature`, bookingId);
    }
    let vidPath: string | null = null;
    if (driver.videoBlob) {
      vidPath = await uploadVideoToStorage(driver.videoBlob, bookingId);
    }
    return {
      participantName: driver.driverName,
      driverNumber: driverNum,
      participantDOB: driver.dob,
      participantAddress: driver.address,
      driversLicenseId: driver.licenseId,
      signaturePath: sigPath,
      idPhotoPath: idPath,
      boaterIdPhotoPath: boaterPath,
      liabilityVideoPath: vidPath,
      safetySignaturePath: safetySigPath,
      guardianSignaturePath: guardianSigPath,
      photoVideoOptOut: driver.photoOptOut,
      isMinor: driver.isMinor,
      minorName: driver.isMinor ? driver.minorName : undefined,
      minorAge: driver.isMinor ? driver.minorAge : undefined,
      guardianName: driver.isMinor ? driver.guardianName : undefined,
      signedAt: new Date().toISOString(),
      safetyBriefingSignedAt: new Date().toISOString(),
    };
  };

  // Convert data URL to Blob without fetch() — more reliable on mobile Safari
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, base64] = dataUrl.split(',');
    const mimeMatch = meta.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  };

  // Helper: upload a file via FormData to our upload API (with retry)
  const uploadFileToStorage = async (file: File | Blob, type: string, bookingId: string): Promise<string | null> => {
    // Strip driver prefix for the API type validation (e.g. "driver-1/signature" → "signature")
    const apiType = type.includes('/') ? type.split('/').pop()! : type;
    const formData = new FormData();
    const fileName = file instanceof File ? file.name : `${apiType}.${apiType === 'video' ? 'webm' : 'png'}`;
    formData.append('file', file, fileName);
    formData.append('type', apiType);
    formData.append('bookingId', bookingId);
    formData.append('storagePath', type);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`Upload failed (${type}, attempt ${attempt + 1}):`, err);
          if (attempt === 0) continue;
          return null;
        }
        const data = await res.json();
        return data.path || null;
      } catch (e) {
        console.error(`Upload error (${type}, attempt ${attempt + 1}):`, e);
        if (attempt === 0) continue;
        return null;
      }
    }
    return null;
  };

  // Helper: upload a data URL (signature) as a file
  const uploadDataUrlToStorage = async (dataUrl: string, type: string, bookingId: string): Promise<string | null> => {
    try {
      const blob = dataUrlToBlob(dataUrl);
      return uploadFileToStorage(blob, type, bookingId);
    } catch (e) {
      console.error('Data URL conversion failed:', e);
      return null;
    }
  };

  // Helper: upload video via presigned URL (bypasses Vercel body limits)
  const uploadVideoToStorage = async (blob: Blob, bookingId: string): Promise<string | null> => {
    try {
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, type: 'video', ext: 'webm' }),
      });
      if (!presignRes.ok) return null;
      const { uploadUrl, storagePath } = await presignRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/webm', 'x-upsert': 'true' },
        body: blob,
      });
      if (!uploadRes.ok) {
        // Fallback: try as FormData upload
        return uploadFileToStorage(blob, 'video', bookingId);
      }
      return storagePath;
    } catch {
      return null;
    }
  };

  const handleWaiverOnlySubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const tempId = `wv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

      setUploadProgress('Uploading ID photo...');
      const idPhotoPath = waiverIdPhotoFile
        ? await uploadFileToStorage(waiverIdPhotoFile, 'id-photo', tempId)
        : null;

      setUploadProgress('Uploading boater ID...');
      const boaterIdPath = waiverBoaterIdPhotoFile
        ? await uploadFileToStorage(waiverBoaterIdPhotoFile, 'boater-id', tempId)
        : null;

      setUploadProgress('Uploading signature...');
      const signaturePath = waiverSignature
        ? await uploadDataUrlToStorage(waiverSignature, 'signature', tempId)
        : null;

      const safetySignaturePath = safetySignature
        ? await uploadDataUrlToStorage(safetySignature, 'safety-signature', tempId)
        : null;

      let guardianSignaturePath: string | null = null;
      if (waiverIsMinor && waiverGuardianSignature) {
        guardianSignaturePath = await uploadDataUrlToStorage(waiverGuardianSignature, 'guardian-signature', tempId);
      }

      let videoPath: string | null = null;
      if (videoBlob) {
        setUploadProgress('Uploading liability video...');
        videoPath = await uploadVideoToStorage(videoBlob, tempId);
      }

      const driverWaivers = [];
      for (let i = 0; i < additionalDrivers.length; i++) {
        setUploadProgress(`Uploading Driver ${i + 2} files...`);
        const dw = await uploadDriverFiles(additionalDrivers[i], tempId, i + 1);
        driverWaivers.push(dw);
      }

      // Verify uploads succeeded before submitting
      if (!signaturePath) {
        throw new Error('Signature upload failed. Please clear and re-sign your signature, then try again.');
      }
      if (!idPhotoPath) {
        throw new Error('ID photo upload failed. Please re-upload your ID photo and try again.');
      }
      if (!boaterIdPath) {
        throw new Error('Boater ID upload failed. Please re-upload your boater ID and try again.');
      }

      setUploadProgress('Saving waiver...');

      const primaryWaiver = {
        participantName: customerName,
        driverNumber: 0,
        participantDOB: waiverDOB,
        participantAddress: waiverAddress,
        driversLicenseId: waiverLicenseId,
        signaturePath,
        idPhotoPath,
        boaterIdPhotoPath: boaterIdPath,
        liabilityVideoPath: videoPath,
        safetySignaturePath,
        guardianSignaturePath,
        safetyBriefingSignedAt: new Date().toISOString(),
        photoVideoOptOut: waiverPhotoOptOut,
        isMinor: waiverIsMinor,
        minorName: waiverIsMinor ? waiverMinorName : undefined,
        minorAge: waiverIsMinor ? waiverMinorAge : undefined,
        guardianName: waiverIsMinor ? waiverGuardianName : undefined,
        signedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/waiver-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tempId,
          customerName,
          customerEmail,
          customerPhone,
          waivers: [primaryWaiver, ...driverWaivers],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(data.error || 'Failed to save waiver');
      }

      setStep('success');
      setBookingResult({ id: tempId, date: '', startTime: '', totalPrice: 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
    setUploadProgress('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Generate a temporary booking ID for file uploads
      const tempBookingId = `bk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

      // Upload files to storage
      setUploadProgress('Uploading ID photo...');
      const idPhotoPath = waiverIdPhotoFile
        ? await uploadFileToStorage(waiverIdPhotoFile, 'id-photo', tempBookingId)
        : null;

      setUploadProgress('Uploading boater ID...');
      const boaterIdPath = waiverBoaterIdPhotoFile
        ? await uploadFileToStorage(waiverBoaterIdPhotoFile, 'boater-id', tempBookingId)
        : null;

      setUploadProgress('Uploading waiver signature...');
      const signaturePath = waiverSignature
        ? await uploadDataUrlToStorage(waiverSignature, 'signature', tempBookingId)
        : null;

      setUploadProgress('Uploading safety signature...');
      const safetySignaturePath = safetySignature
        ? await uploadDataUrlToStorage(safetySignature, 'safety-signature', tempBookingId)
        : null;

      let guardianSignaturePath: string | null = null;
      if (waiverIsMinor && waiverGuardianSignature) {
        setUploadProgress('Uploading guardian signature...');
        guardianSignaturePath = await uploadDataUrlToStorage(waiverGuardianSignature, 'guardian-signature', tempBookingId);
      }

      let videoPath: string | null = null;
      if (videoBlob) {
        setUploadProgress('Uploading liability video...');
        videoPath = await uploadVideoToStorage(videoBlob, tempBookingId);
      }

      // Upload additional driver files
      const driverWaivers = [];
      for (let i = 0; i < additionalDrivers.length; i++) {
        setUploadProgress(`Uploading Driver ${i + 2} files...`);
        const driverWaiver = await uploadDriverFiles(additionalDrivers[i], tempBookingId, i + 1);
        driverWaivers.push(driverWaiver);
      }

      // Verify uploads succeeded before submitting
      if (!signaturePath) {
        throw new Error('Signature upload failed. Please clear and re-sign your signature, then try again.');
      }
      if (!idPhotoPath) {
        throw new Error('ID photo upload failed. Please re-upload your ID photo and try again.');
      }
      if (!boaterIdPath) {
        throw new Error('Boater ID upload failed. Please re-upload your boater ID and try again.');
      }

      setUploadProgress(isGroupon ? 'Confirming your booking...' : 'Processing payment...');

      const primaryWaiver = {
        participantName: customerName,
        driverNumber: 0,
        participantDOB: waiverDOB,
        participantAddress: waiverAddress,
        driversLicenseId: waiverLicenseId,
        signaturePath: signaturePath,
        idPhotoPath: idPhotoPath,
        boaterIdPhotoPath: boaterIdPath,
        liabilityVideoPath: videoPath,
        safetySignaturePath: safetySignaturePath,
        guardianSignaturePath: guardianSignaturePath,
        safetyBriefingSignedAt: new Date().toISOString(),
        photoVideoOptOut: waiverPhotoOptOut,
        isMinor: waiverIsMinor,
        minorName: waiverIsMinor ? waiverMinorName : undefined,
        minorAge: waiverIsMinor ? waiverMinorAge : undefined,
        guardianName: waiverIsMinor ? waiverGuardianName : undefined,
        signedAt: new Date().toISOString(),
      };

      const bookingPayload = {
        jetSkiId: selectBoth ? 'both' : selectedJetSki!.id,
        date: selectedDate,
        timeSlotId: selectedSlot!.id,
        startTime: selectedTime,
        customerName,
        customerEmail,
        customerPhone,
        protectionTier: isGroupon ? 'none' : (selectedProtection || 'none'),
        isGroupon,
        waivers: [primaryWaiver, ...driverWaivers],
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      // Handle non-JSON responses gracefully
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server error. Please try again.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // If Stripe checkout URL is returned, redirect to payment
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // No-payment mode
      setBookingResult(data.booking);
      setStep('success');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
    setUploadProgress('');
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const today = startOfToday();

  const steps: { key: Step; label: string }[] = waiverOnly ? [
    { key: 'details', label: 'Details' },
    { key: 'waiver', label: 'Waiver' },
    { key: 'safety', label: 'Safety' },
    { key: 'fwc', label: 'FWC' },
    { key: 'adddriver', label: 'Drivers' },
  ] : [
    { key: 'date', label: 'Date' },
    { key: 'duration', label: 'Duration' },
    { key: 'jetski', label: 'Jet Ski' },
    { key: 'time', label: 'Time' },
    { key: 'details', label: 'Details' },
    { key: 'waiver', label: 'Waiver' },
    { key: 'safety', label: 'Safety' },
    { key: 'fwc', label: 'FWC' },
    { key: 'adddriver', label: 'Drivers' },
    ...(isGroupon ? [] : [
      { key: 'protection' as Step, label: 'Protection' },
      ...(selectedProtection === 'none' ? [{ key: 'deposit' as Step, label: 'Deposit' }] : []),
    ]),
    { key: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-brand-900";

  return (
    <div className="card p-6 md:p-8">
      {/* Progress Steps */}
      {step !== 'success' && (
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all',
                    i < currentStepIndex && 'bg-green-500 text-white',
                    i === currentStepIndex && 'bg-brand-600 text-white shadow-lg shadow-brand-200',
                    i > currentStepIndex && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {i < currentStepIndex ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[9px] sm:text-[10px] mt-1 font-medium whitespace-nowrap',
                  i <= currentStepIndex ? 'text-brand-700' : 'text-gray-400'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-4 sm:w-12 h-0.5 mx-0.5 sm:mx-1.5 mt-[-14px]',
                  i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Choose Your Date</h3>

          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="p-2 hover:bg-brand-50 rounded-lg"
                disabled={isBefore(addMonths(currentMonth, -1), startOfMonth(today))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="font-semibold text-brand-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-brand-50 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-brand-600/50 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(day, today);
                const isSelected = dateStr === selectedDate;
                const isWeekendDay = isWeekend(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isPast && setSelectedDate(dateStr)}
                    disabled={isPast}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                      isPast && 'text-gray-300 cursor-not-allowed',
                      !isPast && !isSelected && 'hover:bg-brand-50 text-brand-800',
                      !isPast && isWeekendDay && !isSelected && 'text-sunset-600',
                      isSelected && 'bg-brand-600 text-white shadow-lg',
                      isToday(day) && !isSelected && 'ring-2 ring-brand-300'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-brand-600/50">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-brand-600" />
                Selected
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-brand-300" />
                Today
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sunset-600 font-bold">$</span>
                Weekend pricing
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep('duration')}
              disabled={!selectedDate}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Duration */}
      {step === 'duration' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-2">Choose Your Duration</h3>
          <p className="text-sm text-brand-600/50 mb-6">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            {isWeekend(parseISO(selectedDate)) && (
              <span className="ml-2 text-sunset-500 font-medium">(Weekend pricing)</span>
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timeSlots.map((slot) => {
              const price = isWeekend(parseISO(selectedDate)) ? slot.weekendPrice : slot.weekdayPrice;
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'p-5 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    <span className="font-bold text-brand-900">{slot.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">
                    ${price}
                    <span className="text-sm font-normal text-brand-600/50 ml-1">per jet ski</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('date')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('jetski')}
              disabled={!selectedSlot}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Jet Ski */}
      {step === 'jetski' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Choose Your Jet Ski</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jetSkis.map((js) => {
              const isSelected = !selectBoth && selectedJetSki?.id === js.id;

              return (
                <button
                  key={js.id}
                  onClick={() => { setSelectBoth(false); setSelectedJetSki(js); }}
                  className={cn(
                    'p-5 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-ocean-500 rounded-xl flex items-center justify-center">
                      <Waves className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-900">{js.name}</div>
                    </div>
                  </div>
                  <p className="text-sm text-brand-700/60">{js.description}</p>
                </button>
              );
            })}
          </div>

          {/* Both Jet Skis option */}
          {jetSkis.length >= 2 && (
            <div className="mt-4">
              <button
                onClick={() => { setSelectBoth(true); setSelectedJetSki(null); }}
                className={cn(
                  'w-full p-5 rounded-xl border-2 text-left transition-all',
                  selectBoth
                    ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-ocean-50 shadow-lg'
                    : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-sunset-400 to-brand-500 rounded-xl flex items-center justify-center">
                    <Waves className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-900">Both Jet Skis</div>
                    <span className="text-xs font-semibold text-sunset-600">2x price — perfect for groups!</span>
                  </div>
                </div>
                <p className="text-sm text-brand-700/60">
                  Reserve both Wave Runners for the same time slot. Great for friends, families, or racing each other!
                </p>
              </button>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('duration')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('time')}
              disabled={!selectedJetSki && !selectBoth}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-2">Pick Your Start Time</h3>
          <p className="text-sm text-brand-600/50 mb-6">
            {selectBoth ? 'Both Jet Skis' : selectedJetSki?.name} &middot; {selectedSlot?.label} &middot; {format(parseISO(selectedDate), 'MMM d, yyyy')}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="ml-3 text-brand-600">Checking availability...</span>
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-brand-700/60 mb-4">No available times for this selection.</p>
              <button onClick={() => setStep('date')} className="btn-secondary">Choose a Different Date</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 px-3 rounded-xl text-sm font-medium transition-all border',
                    selectedTime === time
                      ? 'border-brand-500 bg-brand-600 text-white shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-brand-800'
                  )}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('jetski')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('details')}
              disabled={!selectedTime}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Customer Details */}
      {step === 'details' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Your Details</h3>

          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Full Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Email Address *</label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Phone Number *</label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 000-0000" className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {!waiverOnly && <button onClick={() => setStep('time')} className="btn-secondary">Back</button>}
            {waiverOnly && <div />}
            <button
              onClick={() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(customerEmail)) {
                  setError('Please enter a valid email address.');
                  return;
                }
                setError('');
                setWaiverScrolledToBottom(false);
                setStep('waiver');
              }}
              disabled={!customerName || !customerEmail || !customerPhone}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Waiver
            </button>
          </div>
        </div>
      )}

      {/* Step: Waiver */}
      {step === 'waiver' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-bold text-brand-900">
              {isDriverWaiverMode ? `Additional Driver Waiver` : 'Liability Waiver'}
            </h3>
          </div>
          {isDriverWaiverMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <label className="block text-sm font-medium text-blue-800 mb-1.5">Driver&apos;s Full Name *</label>
              <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Enter driver's full name" className={inputClass} />
            </div>
          )}
          <p className="text-sm text-brand-600/60 mb-4">
            Please read the waiver carefully, scroll to the bottom, then fill in your details and sign.
          </p>

          {/* Scrollable waiver text */}
          <div
            ref={waiverScrollRef}
            onScroll={handleWaiverScroll}
            className="h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50/50"
          >
            <WaiverText />
          </div>

          {!waiverScrolledToBottom && (
            <p className="text-xs text-amber-600 font-medium mb-4 text-center">
              Please scroll to the bottom of the waiver to continue
            </p>
          )}

          {waiverScrolledToBottom && (
            <div className="space-y-5 max-w-lg mx-auto">
              {/* Participant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1.5">Date of Birth *</label>
                  <input type="date" value={waiverDOB} onChange={e => setWaiverDOB(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1.5">Driver&apos;s License / ID # *</label>
                  <input type="text" value={waiverLicenseId} onChange={e => setWaiverLicenseId(e.target.value)} placeholder="DL-XXXXXXX" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">Address *</label>
                <input type="text" value={waiverAddress} onChange={e => setWaiverAddress(e.target.value)} placeholder="123 Main St, City, State ZIP" className={inputClass} />
              </div>

              {/* ID Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">Upload Photo of ID *</label>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIdPhotoUpload}
                  className="hidden"
                />
                {waiverIdPhoto ? (
                  <div className="relative">
                    <img src={waiverIdPhoto} alt="ID Photo" className="w-full h-32 object-cover rounded-xl border border-green-300" />
                    <button
                      onClick={() => { setWaiverIdPhoto(''); if (idInputRef.current) idInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => idInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">Tap to take photo or upload</span>
                    <span className="text-xs text-gray-400">Driver&apos;s license or government-issued ID</span>
                  </button>
                )}
              </div>

              {/* Boater ID Upload */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Anchor className="w-4 h-4 text-ocean-500" />
                    Upload Boater&apos;s License / Boater ID *
                  </span>
                </label>
                <input
                  ref={boaterIdInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBoaterIdUpload}
                  className="hidden"
                />
                {waiverBoaterIdPhoto ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={waiverBoaterIdPhoto} alt="Boater ID" className="w-full h-32 object-cover rounded-xl border border-green-300" />
                    <button
                      onClick={() => { setWaiverBoaterIdPhoto(''); if (boaterIdInputRef.current) boaterIdInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => boaterIdInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-ocean-400 hover:bg-ocean-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">Tap to take photo or upload</span>
                    <span className="text-xs text-gray-400">Florida Boater Safety ID Card or equivalent</span>
                  </button>
                )}
                <a
                  href="https://www.boatus.org/fl-temp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs text-brand-500 hover:text-brand-700 underline text-center"
                >
                  Don&apos;t have your boating license? No problem! Take this quick course &rarr;
                </a>
              </div>

              {/* Video Liability Statement */}
              <VideoRecorder
                onVideoChange={setWaiverLiabilityVideo}
                onVideoBlob={(blob) => setVideoBlob(blob)}
                statementText={LIABILITY_STATEMENT}
              />

              {/* Photo/Video Opt Out */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverPhotoOptOut}
                  onChange={e => setWaiverPhotoOptOut(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-brand-800">Opt out of photo/video use</span>
                  <p className="text-xs text-gray-500 mt-0.5">Check this if you do NOT want your photos/videos used for marketing.</p>
                </div>
              </label>

              {/* Minor section */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverIsMinor}
                  onChange={e => setWaiverIsMinor(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-brand-800">Signing for a minor (under 18)</span>
                  <p className="text-xs text-gray-500 mt-0.5">Check this if the rider is under 18 years old.</p>
                </div>
              </label>

              {waiverIsMinor && (
                <div className="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                  <h4 className="font-semibold text-brand-900 text-sm">Minor Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-800 mb-1.5">Minor&apos;s Name *</label>
                      <input type="text" value={waiverMinorName} onChange={e => setWaiverMinorName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-800 mb-1.5">Minor&apos;s Age *</label>
                      <input type="number" value={waiverMinorAge} onChange={e => setWaiverMinorAge(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-800 mb-1.5">Parent/Guardian Name *</label>
                    <input type="text" value={waiverGuardianName} onChange={e => setWaiverGuardianName(e.target.value)} className={inputClass} />
                  </div>
                  <SignaturePad label="Parent/Guardian Signature *" onSignatureChange={setWaiverGuardianSignature} />
                </div>
              )}

              {/* Main Signature */}
              <SignaturePad label="Your Signature *" onSignatureChange={setWaiverSignature} />

              <p className="text-xs text-gray-500 text-center">
                By signing above, I acknowledge that I have read and understood the entire waiver, and I voluntarily agree to all terms.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => {
              if (isDriverWaiverMode) {
                resetWaiverFields();
                setIsDriverWaiverMode(false);
                setStep('adddriver');
              } else {
                setStep('details');
              }
            }} className="btn-secondary">Back</button>
            <button
              onClick={() => { setSafetyScrolledToBottom(false); setStep('safety'); }}
              disabled={!waiverScrolledToBottom || !isWaiverComplete() || (isDriverWaiverMode && !driverName)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Safety Briefing
            </button>
          </div>
        </div>
      )}

      {/* Step: Safety Briefing */}
      {step === 'safety' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold text-brand-900">Safety Briefing Confirmation</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-4">
            Please read the safety briefing carefully, scroll to the bottom, then sign to acknowledge.
          </p>

          {/* Scrollable safety briefing text */}
          <div
            ref={safetyScrollRef}
            onScroll={handleSafetyScroll}
            className="h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50/50"
          >
            <SafetyBriefingText />
          </div>

          {!safetyScrolledToBottom && (
            <p className="text-xs text-amber-600 font-medium mb-4 text-center">
              Please scroll to the bottom of the safety briefing to continue
            </p>
          )}

          {safetyScrolledToBottom && (
            <div className="space-y-5 max-w-lg mx-auto">
              <SignaturePad label="Signature — I acknowledge the safety briefing *" onSignatureChange={setSafetySignature} />
              <p className="text-xs text-gray-500 text-center">
                By signing above, I confirm that I received and understand the safety briefing and agree to follow all rules and instructions.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('waiver')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('fwc')}
              disabled={!safetyScrolledToBottom || !safetySignature}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: FWC Attestation */}
      {step === 'fwc' && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-5 h-5 text-brand-600" />
            <h3 className="text-xl font-bold text-brand-900">FWC Pre-Rental Checklist</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-4">
            Required by the Florida Fish and Wildlife Conservation Commission. Check each box to confirm you received instruction on the topic.
          </p>

          <div className="h-80 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50/50">
            <FWCAttestationChecklist onComplete={setFwcComplete} />
          </div>

          {fwcComplete && (
            <div className="mt-4 space-y-4 max-w-lg mx-auto">
              <SignaturePad label="Renter Signature — I acknowledge the pre-rental instruction *" onSignatureChange={setFwcSignature} />
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('safety')} className="btn-secondary">Back</button>
            <button
              onClick={() => {
                if (isDriverWaiverMode) {
                  saveCurrentDriverWaiver();
                  setIsDriverWaiverMode(false);
                  setStep('adddriver');
                } else {
                  setStep('adddriver');
                }
              }}
              disabled={!fwcComplete || !fwcSignature}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Add Driver */}
      {step === 'adddriver' && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Waves className="w-5 h-5 text-brand-600" />
            <h3 className="text-xl font-bold text-brand-900">Additional Drivers</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-6">
            Will anyone else be driving the jet ski? Each additional driver must complete the waiver, safety briefing, and FWC checklist.
          </p>

          {additionalDrivers.length > 0 && (
            <div className="space-y-3 mb-6">
              {additionalDrivers.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                  <div>
                    <span className="font-semibold text-brand-900">{d.driverName}</span>
                    <span className="text-sm text-green-600 ml-2">Driver {i + 2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4" /> Complete
                    </span>
                    <button
                      onClick={() => setAdditionalDrivers(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={startAddDriver}
            className="w-full py-4 border-2 border-dashed border-brand-300 rounded-xl text-brand-600 font-semibold hover:border-brand-500 hover:bg-brand-50/50 transition-colors mb-4"
          >
            + Add a Driver
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('fwc')} className="btn-secondary">Back</button>
            <button
              onClick={() => {
                if (waiverOnly) {
                  handleWaiverOnlySubmit();
                } else if (isGroupon) {
                  setStep('confirm');
                } else {
                  setStep('protection');
                }
              }}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress || 'Submitting...'}
                </>
              ) : waiverOnly ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {additionalDrivers.length > 0 ? 'Submit All Waivers' : 'Submit Waiver'}
                </>
              ) : (
                additionalDrivers.length > 0 ? 'Continue' : 'No Additional Drivers — Continue'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Protection Plan */}
      {step === 'protection' && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <h3 className="text-xl font-bold text-brand-900">Damage Protection</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-6">
            Choose a damage protection plan or proceed with a $300 security deposit hold per jet ski.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROTECTION_TIERS.map((tier) => {
              const isSelected = selectedProtection === tier.id;
              const perSki = tier.id === 'none' ? '' : `$${tier.price}/jet ski`;
              const totalCost = tier.id === 'none' ? `$${getDepositTotal()} hold` : `$${tier.price * getJetSkiCount()} total`;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedProtection(tier.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? tier.id === 'platinum' ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : tier.id === 'gold' ? 'border-amber-500 bg-amber-50 shadow-lg'
                      : tier.id === 'silver' ? 'border-slate-400 bg-slate-50 shadow-lg'
                      : 'border-gray-400 bg-gray-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'font-bold text-sm',
                      tier.id === 'platinum' ? 'text-purple-700' :
                      tier.id === 'gold' ? 'text-amber-700' :
                      tier.id === 'silver' ? 'text-slate-700' :
                      'text-gray-700'
                    )}>
                      {tier.name}
                    </span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  {tier.id !== 'none' ? (
                    <>
                      <div className="text-lg font-bold text-brand-900">{perSki}</div>
                      <div className="text-xs text-gray-500">${tier.deductible.toLocaleString()} deductible</div>
                      <div className="text-xs text-gray-400 mt-1">{tier.description}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-brand-900">$0</div>
                      <div className="text-xs text-gray-500">{tier.description}</div>
                      <div className="text-xs text-amber-600 mt-1">You accept full financial responsibility</div>
                    </>
                  )}
                  <div className="text-xs font-semibold text-brand-600 mt-2">{totalCost}</div>
                </button>
              );
            })}
          </div>

          {selectedProtection && selectedProtection !== 'none' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-green-800">
                <strong>{PROTECTION_TIERS.find(t => t.id === selectedProtection)?.name} Protection:</strong> Your coverage costs <strong>${getProtectionPrice()}</strong> and will be added to your rental total.
                If damage occurs, you only pay the <strong>${PROTECTION_TIERS.find(t => t.id === selectedProtection)?.deductible.toLocaleString()}</strong> deductible. No security deposit hold needed.
              </p>
            </div>
          )}

          {selectedProtection === 'none' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-amber-800">
                <strong>No coverage selected.</strong> A <strong>${getDepositTotal()} security deposit hold</strong> will be placed on your card (not charged).
                You will be responsible for all damages during your rental. You&apos;ll need to sign a damage responsibility waiver next.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('adddriver')} className="btn-secondary">Back</button>
            <button
              onClick={() => {
                if (selectedProtection === 'none') {
                  setDepositScrolledToBottom(false);
                  setStep('deposit');
                } else {
                  setStep('confirm');
                }
              }}
              disabled={!selectedProtection}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedProtection === 'none' ? 'Continue to Deposit Waiver' : 'Review Booking'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Deposit / Livery Waiver (only if no insurance) */}
      {step === 'deposit' && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl font-bold text-brand-900">Security Deposit &amp; Damage Responsibility</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-2">
            A temporary hold of <strong className="text-brand-900">${getDepositTotal()}</strong> ($300 per jet ski) will be placed on your card.
            This is NOT a charge &mdash; it will be released after your rental.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-800">
              <strong>How it works:</strong> The ${getDepositTotal()} hold reserves funds on your card but does not charge you.
              If no damage occurs, the hold is automatically released within 5&ndash;7 business days. You will only be charged
              if damage occurs during your rental.
            </p>
          </div>
          <p className="text-sm text-brand-600/60 mb-4">
            Please read the damage responsibility agreement below, scroll to the bottom, then sign.
          </p>

          <div
            ref={depositScrollRef}
            onScroll={handleDepositScroll}
            className="h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50/50"
          >
            <LiveryWaiverText />
          </div>

          {!depositScrolledToBottom && (
            <p className="text-xs text-amber-600 font-medium mb-4 text-center">
              Please scroll to the bottom of the agreement to continue
            </p>
          )}

          {depositScrolledToBottom && (
            <div className="space-y-5 max-w-lg mx-auto">
              <SignaturePad label="Signature — I accept the security deposit and damage responsibility terms *" onSignatureChange={setDepositSignature} />
              <p className="text-xs text-gray-500 text-center">
                By signing above, I authorize the ${getDepositTotal()} security deposit hold and accept full damage responsibility as described above.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('protection')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!depositScrolledToBottom || !depositSignature}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">
            Review Your Booking
          </h3>

          <div className="bg-brand-50/50 rounded-xl p-6 space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Date</span>
              <span className="font-semibold text-brand-900">{format(parseISO(selectedDate), 'EEEE, MMM d, yyyy')}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Time</span>
              <span className="font-semibold text-brand-900">{formatTime(selectedTime)}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Duration</span>
              <span className="font-semibold text-brand-900">{selectedSlot?.label}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Jet Ski</span>
              <span className="font-semibold text-brand-900">{selectBoth ? 'Both Jet Skis' : selectedJetSki?.name}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Name</span>
              <span className="font-semibold text-brand-900">{customerName}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Waiver</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Safety Briefing</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Acknowledged
              </span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">FWC Checklist</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Complete
              </span>
            </div>
            {additionalDrivers.length > 0 && (
              <>
                <div className="border-t border-brand-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-600/60">Additional Drivers</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {additionalDrivers.length} driver{additionalDrivers.length > 1 ? 's' : ''} signed
                  </span>
                </div>
                {additionalDrivers.map((d, i) => (
                  <div key={i} className="flex justify-between items-center pl-4">
                    <span className="text-xs text-brand-600/40">Driver {i + 2}</span>
                    <span className="text-xs font-medium text-brand-700">{d.driverName}</span>
                  </div>
                ))}
              </>
            )}
            {!isGroupon && (
            <>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Protection</span>
              <span className="font-semibold text-brand-900">
                {selectedProtection === 'none'
                  ? 'No coverage'
                  : `${PROTECTION_TIERS.find(t => t.id === selectedProtection)?.name} ($${getProtectionPrice()})`
                }
              </span>
            </div>
            {selectedProtection === 'none' && (
              <>
                <div className="border-t border-brand-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-600/60">Security Deposit</span>
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    <CreditCard className="w-4 h-4" /> ${getDepositTotal()} hold
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-600/60">Damage Waiver</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Signed
                  </span>
                </div>
              </>
            )}
            <div className="border-t-2 border-brand-200 pt-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-brand-900">Total</span>
              <span className="text-2xl font-bold text-brand-600">${getTotalWithProtection()}</span>
            </div>
            </>
            )}
            {isGroupon && (
              <div className="border-t-2 border-brand-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-brand-900">Payment</span>
                  <span className="text-lg font-bold text-green-600">No Payment Required</span>
                </div>
              </div>
            )}
          </div>

          {!isGroupon && (
            <>
              {selectedProtection === 'none' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                  <p className="text-xs text-amber-800 text-center">
                    Your card will be charged <strong>${getPrice()}</strong> for the rental. A <strong>${getDepositTotal()}</strong> security deposit
                    hold will also be placed (not charged, released after rental).
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
                  <p className="text-xs text-green-800 text-center">
                    Your card will be charged <strong>${getTotalWithProtection()}</strong> (rental + {PROTECTION_TIERS.find(t => t.id === selectedProtection)?.name} protection).
                    No security deposit hold needed.
                  </p>
                </div>
              )}
              <p className="text-xs text-brand-600/40 text-center mt-4">
                You&apos;ll be redirected to our secure payment page to complete your booking.
              </p>
            </>
          )}

          {isGroupon && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-blue-800 text-center">
                No payment required. Click below to confirm your booking.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => {
              if (isGroupon) {
                setStep('adddriver');
              } else {
                setStep(selectedProtection === 'none' ? 'deposit' : 'protection');
              }
            }} className="btn-secondary" disabled={submitting}>Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress || 'Booking...'}
                </>
              ) : isGroupon ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Booking
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay & Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && bookingResult && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          {waiverOnly ? (
            <>
              <h3 className="text-2xl font-bold text-brand-900 mb-2">Waiver Complete!</h3>
              <p className="text-brand-600/60 mb-8 max-w-md mx-auto">
                Your waiver has been signed and submitted successfully. You&apos;re all set for your ride!
              </p>

              <div className="bg-brand-50/50 rounded-xl p-6 max-w-sm mx-auto mb-8 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Name</span>
                  <span className="font-semibold text-brand-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Waiver</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Signed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Safety Briefing</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Acknowledged
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">FWC Checklist</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Complete
                  </span>
                </div>
                {additionalDrivers.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-600/60">Additional Drivers</span>
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> {additionalDrivers.length} driver{additionalDrivers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-brand-900 mb-2">Booking Confirmed!</h3>
              <p className="text-brand-600/60 mb-8 max-w-md mx-auto">
                Your jet ski reservation is locked in. A confirmation email will be sent to {customerEmail}.
              </p>

              <div className="bg-brand-50/50 rounded-xl p-6 max-w-sm mx-auto mb-8 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Booking ID</span>
                  <span className="font-mono text-sm font-bold text-brand-800">{bookingResult.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Date</span>
                  <span className="font-semibold text-brand-900">{format(parseISO(bookingResult.date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Time</span>
                  <span className="font-semibold text-brand-900">{formatTime(bookingResult.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Total</span>
                  <span className="font-bold text-brand-600">${bookingResult.totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Waiver</span>
                  <span className="font-semibold text-green-600">Signed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-600/60">Safety Briefing</span>
                  <span className="font-semibold text-green-600">Acknowledged</span>
                </div>
              </div>
            </>
          )}

          <a href="/" className="btn-primary inline-flex">
            Back to Home
          </a>
        </div>
      )}
    </div>
  );
}
