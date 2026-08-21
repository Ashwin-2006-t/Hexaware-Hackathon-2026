import React, { useState, useEffect } from 'react'
import {
  Users, UserPlus, Shield, ShieldCheck, CheckCircle2,
  Lock, HeartHandshake, Mail,
  Trash2, Copy, Check,
  Calendar, Video, RefreshCw, X
} from 'lucide-react'
import type {
  User, FamilyCircleResponse, FamilyMember,
  ConnectedSenior, SeniorDashboardForFamily
} from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'

interface FamilyCircleProps {
  highContrast: boolean
  currentUser: User | null
  language?: Language
  onStartVirtualCall?: (bookingId: number) => void
}

export const FamilyCircle: React.FC<FamilyCircleProps> = ({
  highContrast,
  currentUser,
  language = 'en',
  onStartVirtualCall
}) => {
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<'senior_manager' | 'family_portal'>('senior_manager')
  const [circleData, setCircleData] = useState<FamilyCircleResponse | null>(null)
  const [connectedSeniors, setConnectedSeniors] = useState<ConnectedSenior[]>([])
  const [selectedSeniorId, setSelectedSeniorId] = useState<number | null>(null)
  const [seniorDashboard, setSeniorDashboard] = useState<SeniorDashboardForFamily | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false)
  const [inviteEmailOrPhone, setInviteEmailOrPhone] = useState<string>('')
  const [inviteRelationship, setInviteRelationship] = useState<string>('Son / Daughter')
  const [invitePermissions, setInvitePermissions] = useState<Record<string, boolean>>({
    VIEW_BOOKINGS: true,
    VIEW_SERVICE_DETAILS: true,
    VIEW_PROVIDER_DETAILS: true,
    RECEIVE_NOTIFICATIONS: true,
    HELP_WITH_REQUESTS: false
  })
  const [inviting, setInviting] = useState<boolean>(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [circle, seniors] = await Promise.all([
        api.getFamilyCircle().catch(() => null),
        api.getConnectedSeniors().catch(() => [])
      ])
      setCircleData(circle)
      setConnectedSeniors(seniors)

      if (seniors.length > 0 && !selectedSeniorId) {
        setSelectedSeniorId(seniors[0].senior_user_id)
      }
    } catch (err) {
      console.error('Family circle error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentUser])

  useEffect(() => {
    if (selectedSeniorId) {
      api.getSeniorDashboardForFamily(selectedSeniorId)
        .then((dash) => setSeniorDashboard(dash))
        .catch(() => setSeniorDashboard(null))
    }
  }, [selectedSeniorId])

  const showToast = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(null), 3500)
  }

  const handleTogglePermission = async (member: FamilyMember, permKey: string, currentVal: boolean) => {
    const updatedPerms: Record<string, boolean> = {}
    member.permissions.forEach((p) => {
      updatedPerms[p.permission] = p.permission === permKey ? !currentVal : p.enabled
    })

    try {
      await api.updateFamilyPermissions(member.relationship_id, updatedPerms)
      showToast(`Permissions updated for ${member.family_name}!`)
      loadData()
    } catch (err: any) {
      alert(`Permission error: ${err.message}`)
    }
  }

  const handleRemoveMember = async (relationshipId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your Family Circle?`)) return
    try {
      await api.removeFamilyMember(relationshipId)
      showToast(`${name} removed from Family Circle.`)
      loadData()
    } catch (err: any) {
      alert(`Remove error: ${err.message}`)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmailOrPhone.trim()) {
      alert('Please enter an email address or mobile number.')
      return
    }

    setInviting(true)
    try {
      const res = await api.inviteFamilyMember({
        email_or_phone: inviteEmailOrPhone.trim(),
        relationship_type: inviteRelationship,
        permissions: invitePermissions
      })
      showToast(`Invitation sent to ${res.email_or_phone}!`)
      setShowInviteModal(false)
      setInviteEmailOrPhone('')
      loadData()
    } catch (err: any) {
      alert(`Invite error: ${err.message}`)
    } finally {
      setInviting(false)
    }
  }

  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2500)
  }

  const handleSimulateAccept = async (token: string) => {
    try {
      const res = await api.acceptFamilyInvitation(token)
      showToast(res.message || 'Invitation accepted!')
      loadData()
    } catch (err: any) {
      alert(`Accept error: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 font-bold text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4B32E6] to-[#4099FF] text-white flex items-center justify-center font-bold shadow-md">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#4B32E6] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Senior-Controlled Trust Network
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-0.5">
                {t.familyCircleTitle}
              </h2>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
            Seniors remain the primary decision-makers. Invite trusted family members (children, relatives, caregivers) with fine-grained, senior-controlled permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('senior_manager')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'senior_manager'
                  ? 'bg-white text-[#4B32E6] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Family Members
            </button>
            <button
              onClick={() => setActiveTab('family_portal')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'family_portal'
                  ? 'bg-white text-[#4B32E6] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Family Care Portal ({connectedSeniors.length})
            </button>
          </div>

          {activeTab === 'senior_manager' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-large bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-md cursor-pointer w-full sm:w-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addFamilyMember}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: SENIOR FAMILY MANAGER */}
      {activeTab === 'senior_manager' && (
        <div className="space-y-6">
          {/* Active Family Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Active Connected Members ({circleData?.members.length || 0})</span>
              </h3>
              <button
                onClick={loadData}
                className="text-xs font-bold text-[#4B32E6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-3">
                <div className="w-8 h-8 border-3 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-bold text-xs text-slate-500">Loading Family Circle...</p>
              </div>
            ) : (!circleData?.members || circleData.members.length === 0) ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-black text-base text-slate-800">No family members connected yet.</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Invite your children or trusted relatives so they can stay updated on your bookings, help with video consultations, or receive service reminders.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-large bg-[#4B32E6] text-white hover:bg-[#3D26D1] text-xs font-bold py-2 px-5 rounded-xl inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite First Family Member</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {circleData.members.map((member) => (
                  <div
                    key={member.relationship_id}
                    className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                      highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {/* Member Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#4B32E6] font-black text-base flex items-center justify-center border border-blue-200">
                          {member.family_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{member.family_name}</h4>
                            <span className="text-[10px] font-black bg-blue-50 text-[#4B32E6] px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                              {member.relationship_type}
                            </span>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                              ✓ ACTIVE
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {member.family_email} {member.family_phone ? `• ${member.family_phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRemoveMember(member.relationship_id, member.family_name)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Access</span>
                        </button>
                      </div>
                    </div>

                    {/* Permission Toggles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Granted Senior Permissions (Senior-Controlled)
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Toggle permissions anytime with immediate effect
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {member.permissions.map((perm) => (
                          <div
                            key={perm.permission}
                            className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                              perm.enabled
                                ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                                : 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-80'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {perm.enabled ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="text-xs font-black text-slate-900 leading-tight">
                                  {perm.label || perm.permission}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-snug">
                                {perm.description}
                              </p>
                            </div>

                            <button
                              onClick={() => handleTogglePermission(member, perm.permission, perm.enabled)}
                              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                                perm.enabled ? 'bg-[#4B32E6]' : 'bg-slate-300'
                              }`}
                              title={perm.enabled ? 'Disable permission' : 'Enable permission'}
                            >
                              <span
                                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                                  perm.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations Section */}
          {circleData?.pending_invitations && circleData.pending_invitations.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>Pending Invitations ({circleData.pending_invitations.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {circleData.pending_invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{inv.email_or_phone}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          inv.is_expired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.is_expired ? 'Expired' : 'Awaiting Acceptance'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        Relationship: <strong>{inv.relationship_type}</strong> • Sent: {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                      <button
                        onClick={() => handleCopyLink(inv.invite_url, inv.token)}
                        className="flex-1 bg-white hover:bg-amber-100/60 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken === inv.token ? 'Copied Link!' : 'Copy Invite Link'}</span>
                      </button>

                      <button
                        onClick={() => handleSimulateAccept(inv.token)}
                        className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer shadow-sm"
                        title="Simulate family member acceptance for hackathon testing"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FAMILY CARE PORTAL (CONNECTED SENIORS) */}
      {activeTab === 'family_portal' && (
        <div className="space-y-6">
          {connectedSeniors.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <Shield className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-black text-base text-slate-800">No connected seniors found.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When a senior citizen invites you to their Family Circle and you accept, their care overview and permitted bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Senior Selector Bar */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Select Senior:</span>
                {connectedSeniors.map((cs) => (
                  <button
                    key={cs.senior_user_id}
                    onClick={() => setSelectedSeniorId(cs.senior_user_id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedSeniorId === cs.senior_user_id
                        ? 'bg-[#4B32E6] text-white border-[#4B32E6] shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cs.senior_name}</span>
                    <span className="text-[10px] opacity-80 uppercase">({cs.relationship_type})</span>
                  </button>
                ))}
              </div>

              {/* Permitted Senior Dashboard */}
              {seniorDashboard && (
                <div className="space-y-6">
                  {/* Senior Overview Card */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={seniorDashboard.senior.avatar_url || '/avatars/seed/lakshmi_amma.jpg'}
                          alt={seniorDashboard.senior.full_name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-slate-900">{seniorDashboard.senior.full_name}</h3>
                            <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              ✓ Verified Senior
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Location: {seniorDashboard.senior.location_name || 'Mumbai, Maharashtra'} • Connected Since {seniorDashboard.relationship.connected_since}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Your Granted Permissions:</span>
                        <div className="flex flex-wrap gap-1">
                          {seniorDashboard.granted_permissions.map((p) => (
                            <span key={p} className="text-[10px] font-black bg-blue-50 text-[#4B32E6] px-2 py-0.5 rounded-md border border-blue-200">
                              {p.replace('VIEW_', '').replace('HELP_WITH_', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Bookings (Strictly checks VIEW_BOOKINGS permission) */}
                  <div className="space-y-3">
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#4B32E6]" />
                      <span>Upcoming & Active Bookings</span>
                    </h4>

                    {seniorDashboard.upcoming_bookings ? (
                      seniorDashboard.upcoming_bookings.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-bold">
                          No active bookings for this senior.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {seniorDashboard.upcoming_bookings.map((b) => (
                            <div key={b.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                                    b.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#4B32E6]'
                                  }`}>
                                    {b.status}
                                  </span>
                                  <h5 className="text-base font-black text-slate-900 mt-1">{b.service_title}</h5>
                                </div>
                                <span className="text-base font-black text-slate-900">{formatINR(b.total_price)}</span>
                              </div>

                              <p className="text-xs font-medium text-slate-500">
                                Date: {b.scheduled_date} • Provider: {b.provider_name}
                              </p>

                              {seniorDashboard.can_help_with_requests && onStartVirtualCall && (
                                <button
                                  onClick={() => onStartVirtualCall(b.id)}
                                  className="w-full bg-blue-50 hover:bg-blue-100 text-[#4B32E6] text-xs font-bold py-2 rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Join Pre-Service Video Call with Senior</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Bookings are private. The senior has not enabled 'VIEW_BOOKINGS' permission.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* INVITE FAMILY MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4B32E6] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t.addFamilyMember}</h3>
                  <p className="text-xs text-slate-500 font-medium">Invite trusted relative to your Family Circle</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Family Member Email or Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. anand.kumar@example.com or +91 98800 44332"
                  value={inviteEmailOrPhone}
                  onChange={(e) => setInviteEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-[#4B32E6] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Relationship Type</label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-[#4B32E6] focus:outline-none"
                >
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Caregiver">Caregiver / Nurse</option>
                  <option value="Relative">Close Relative / Friend</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700">Initial Permissions Granted (Senior-Controlled):</label>
                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  {Object.entries({
                    VIEW_BOOKINGS: "View Upcoming Bookings & Dates",
                    VIEW_SERVICE_DETAILS: "View Service Listings & Rates",
                    VIEW_PROVIDER_DETAILS: "View Provider Contacts & Location",
                    RECEIVE_NOTIFICATIONS: "Receive Service Alerts & Reminders",
                    HELP_WITH_REQUESTS: "Assist with Video Calls & Inquiries"
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={invitePermissions[key] || false}
                        onChange={(e) => setInvitePermissions({
                          ...invitePermissions,
                          [key]: e.target.checked
                        })}
                        className="rounded text-[#4B32E6] focus:ring-[#4B32E6] w-4 h-4 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-[#4B32E6] hover:bg-[#3D26D1] text-white py-2.5 text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {inviting ? 'Generating Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
