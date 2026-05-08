# Used by main process to read Windows idle seconds (GetLastInputInfo).
# Electron powerMonitor.getSystemIdleTime() often stays 0 on Windows.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class DigiTrackerIdle {
  [DllImport("user32.dll")]
  private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  [StructLayout(LayoutKind.Sequential)]
  private struct LASTINPUTINFO {
    public uint cbSize;
    public uint dwTime;
  }
  public static int GetIdleSeconds() {
    LASTINPUTINFO lii = new LASTINPUTINFO();
    lii.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
    if (!GetLastInputInfo(ref lii)) return 0;
    uint tick = (uint)Environment.TickCount;
    uint idleMs = tick - lii.dwTime;
    return (int)(idleMs / 1000u);
  }
}
'@
[DigiTrackerIdle]::GetIdleSeconds()
