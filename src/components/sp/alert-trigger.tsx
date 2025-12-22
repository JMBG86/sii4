'use client'

import { useEffect } from 'react'
import { checkImageAlertsAction } from '@/app/sp/actions'

export function SPAlertTrigger() {
    useEffect(() => {
        // Check if we already checked this session to avoid spamming the DB
        const hasChecked = sessionStorage.getItem('sp_alerts_checked')

        if (!hasChecked) {
            checkImageAlertsAction().then(() => {
                // Mark as checked for this session
                sessionStorage.setItem('sp_alerts_checked', 'true')
            })
        }
    }, [])

    return null
}
