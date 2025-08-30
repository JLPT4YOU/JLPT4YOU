'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, Download, Trash2, Plus, Loader2, Gift, Check } from 'lucide-react';
import { redeemService, type RedeemCode } from '@/services/redeem-service';
import { PREMIUM_DAY_OPTIONS, formatPremiumDays } from '@/utils/redeem-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RedeemCodeManager() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDays, setSelectedDays] = useState('30');
  const [customDays, setCustomDays] = useState('');
  const [description, setDescription] = useState('');
  const [batchCount, setBatchCount] = useState('1');
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, [activeTab]);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const status = activeTab as 'active' | 'redeemed' | 'expired';
      const result = await redeemService.getRedeemCodes(status);
      if (result.success && result.data) {
        setCodes(result.data);
      } else {
        toast.error(result.error || 'Failed to load codes');
      }
    } catch (error) {
      toast.error('Error loading redeem codes');
    } finally {
      setLoading(false);
    }
  };

  // Clipboard helper with fallback for non-secure contexts
  const copyText = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  };

  const handleCreateCode = async () => {
    setCreating(true);
    try {
      const days = selectedDays === 'custom' 
        ? parseInt(customDays) 
        : parseInt(selectedDays);

      if (!days || days <= 0) {
        toast.error('Please enter valid premium days');
        return;
      }

      const count = parseInt(batchCount);
      if (count > 1) {
        // Create batch
        const result = await redeemService.createBatchRedeemCodes({
          premium_days: days,
          description: description || undefined,
          count
        });

        if (result.success) {
          toast.success(`Created ${result.data?.length} redeem codes`);
          setShowCreateDialog(false);
          loadCodes();
          
          // Show codes for copying
          if (result.data) {
            showCodesDialog(result.data);
          }
        } else {
          toast.error(result.error || 'Failed to create codes');
        }
      } else {
        // Create single code
        const result = await redeemService.createRedeemCode({
          premium_days: days,
          description: description || undefined
        });

        if (result.success && result.data) {
          toast.success('Redeem code created successfully');
          setShowCreateDialog(false);
          loadCodes();
          
          // Copy to clipboard
          await copyText(result.data.code);
          toast.success('Code copied to clipboard');
        } else {
          toast.error(result.error || 'Failed to create code');
        }
      }
    } catch (error) {
      toast.error('Error creating redeem code');
    } finally {
      setCreating(false);
    }
  };

  const showCodesDialog = (codes: RedeemCode[]) => {
    const codesList = codes.map(c => c.code).join('\n');
    
    // Create a dialog to show codes
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    dialog.innerHTML = `
      <div class="bg-background p-6 rounded-lg max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4">Generated Codes</h3>
        <textarea class="w-full h-40 p-2 border rounded" readonly>${codesList}</textarea>
        <div class="flex gap-2 mt-4">
          <button id="copy-codes" class="px-4 py-2 bg-primary text-white rounded">Copy All</button>
          <button id="download-codes" class="px-4 py-2 bg-secondary text-white rounded">Download</button>
          <button id="close-dialog" class="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    const copyBtn = document.getElementById('copy-codes') as HTMLButtonElement | null;
    copyBtn?.addEventListener('click', async () => {
      try {
        await copyText(codesList);
        toast.success('Codes copied to clipboard');
        if (copyBtn) {
          const oldHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = '✓ Copied';
          copyBtn.disabled = true;
          setTimeout(() => {
            copyBtn.innerHTML = oldHtml;
            copyBtn.disabled = false;
          }, 1500);
        }
      } catch {
        toast.error('Failed to copy codes');
      }
    });
    
    document.getElementById('download-codes')?.addEventListener('click', () => {
      const blob = new Blob([codesList], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redeem-codes-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    document.getElementById('close-dialog')?.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await copyText(code);
      setCopiedCodeId(id);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedCodeId((prev) => (prev === id ? null : prev)), 1500);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;
    
    try {
      const result = await redeemService.deleteRedeemCode(codeId);
      if (result.success) {
        toast.success('Code deleted successfully');
        loadCodes();
      } else {
        toast.error(result.error || 'Failed to delete code');
      }
    } catch (error) {
      toast.error('Error deleting code');
    }
  };

  const exportCodes = () => {
    const activeCodes = codes.filter(c => c.status === 'active');
    const csv = [
      'Code,Premium Days,Description,Created At',
      ...activeCodes.map(c => 
        `${c.code},${c.premium_days},${c.description || ''},${new Date(c.created_at).toLocaleString('vi-VN')}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redeem-codes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Redeem Code Manager
            </CardTitle>
            <CardDescription>
              Tạo và quản lý mã redeem cho người dùng
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCodes}
              disabled={codes.filter(c => c.status === 'active').length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo Redeem Code</DialogTitle>
                  <DialogDescription>
                    Tạo mã redeem với số ngày premium tùy chỉnh
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Số ngày Premium</Label>
                    <Select value={selectedDays} onValueChange={setSelectedDays}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn số ngày" />
                      </SelectTrigger>
                      <SelectContent>
                        {PREMIUM_DAY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Tùy chỉnh...</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedDays === 'custom' && (
                      <Input
                        type="number"
                        placeholder="Nhập số ngày"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        min="1"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Số lượng code</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={batchCount}
                      onChange={(e) => setBatchCount(e.target.value)}
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tạo nhiều code cùng lúc (tối đa 100)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mô tả (tùy chọn)</Label>
                    <Textarea
                      placeholder="VD: Code khuyến mãi tháng 1"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCreateCode}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo Code'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có mã nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Premium Days</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    {activeTab === 'redeemed' && (
                      <TableHead>Redeemed By</TableHead>
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(code.id, code.code)}
                          >
                            {copiedCodeId === code.id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatPremiumDays(code.premium_days)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {code.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(code.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </TableCell>
                      {activeTab === 'redeemed' && (
                        <TableCell>
                          <span className="text-sm">
                            {code.redeemed_at 
                              ? new Date(code.redeemed_at).toLocaleDateString('vi-VN')
                              : '-'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {code.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteCode(code.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
