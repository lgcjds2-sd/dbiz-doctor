import { useEffect, useState, type ChangeEvent } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { getMyProfile, updateMyProfile } from '@/services/profile'

const MAX_SEAL_BYTES = 500 * 1024 // 500KB

export function AdminConsultantProfile() {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [license, setLicense] = useState('')
  const [sealImage, setSealImage] = useState<string | null>(null)

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setName(p?.consultant_name ?? '')
        setLicense(p?.license_number ?? '')
        setSealImage(p?.seal_image ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSealChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SEAL_BYTES) {
      setError('직인 이미지는 500KB 이하로 올려주세요.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setSealImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateMyProfile({
        consultant_name: name,
        license_number: license,
        seal_image: sealImage,
      })
      await refreshProfile()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">경영지도사 정보 설정</h1>
      <p className="mb-6 text-sm text-slate-500">
        여기에 등록한 이름·등록번호·직인 이미지는 모든 진단보고서의 "경영지도사 소견"
        섹션에 자동으로 표시됩니다.
      </p>

      <Card className="max-w-xl">
        <CardHeader title="담당 경영지도사 정보" />
        <div className="space-y-4">
          <Field label="이름">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </Field>
          <Field label="경영지도사 등록번호">
            <TextInput
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="예: 제2024-000000호"
            />
          </Field>
          <Field label="직인 이미지" hint="투명 배경 PNG 권장, 500KB 이하">
            <input
              type="file"
              accept="image/*"
              onChange={handleSealChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-700"
            />
            {sealImage && (
              <div className="mt-3 flex items-center gap-3">
                <img src={sealImage} alt="직인 미리보기" className="h-20 w-20 rounded border border-slate-200 object-contain" />
                <button
                  type="button"
                  onClick={() => setSealImage(null)}
                  className="text-xs font-medium text-severity-critical hover:underline"
                >
                  이미지 제거
                </button>
              </div>
            )}
          </Field>

          {error && <p className="text-sm text-severity-critical">{error}</p>}
          {saved && <p className="text-sm text-severity-strong">저장되었습니다.</p>}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
