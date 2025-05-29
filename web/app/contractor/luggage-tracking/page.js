"use client";

import { useState, useEffect } from "react";
import { Box, Typography, TextField, Paper, Divider, IconButton, Collapse, CircularProgress } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const [contractId, setContractId] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const supabase = createClientComponentClient();

  const handleSearch = async () => {
    if (!contractId.trim()) return;
    
    setLoading(true);
    setError(null);
    setContract(null);

    try {
      const { data: contracts, error: contractError } = await supabase
        .from('contract')
        .select(`
          id, 
          created_at, 
          accepted_at, 
          pickup_at, 
          delivered_at, 
          cancelled_at, 
          pickup_location, 
          pickup_location_geo, 
          drop_off_location, 
          drop_off_location_geo, 
          contract_status_id, 
          contract_status(status_name), 
          airline_id, 
          delivery_id, 
          airline:airline_id (*), 
          delivery:delivery_id (*)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      if (contracts) {
        const { data: luggage, error: luggageError } = await supabase
          .from('contract_luggage_information')
          .select('*')
          .eq('contract_id', contracts.id);

        if (luggageError) throw luggageError;

        setContract({
          ...contracts,
          luggage: luggage || []
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch contract');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" color="primary.main" fontWeight="bold">
          Luggage Tracking
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          label="Track Luggage"
          variant="outlined"
          size="small"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: "300px" }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}

      {contract && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
              Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{contract.id}</span>
            </Typography>
            <Divider sx={{ my: 1, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              Location Information
            </Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_location || 'N/A'}</span>
              </Typography>
              {contract.pickup_location_geo && (
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Pickup Coordinates:</b> <span style={{ color: 'text.primary' }}>
                    {contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}
                  </span>
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{contract.drop_off_location || 'N/A'}</span>
              </Typography>
              {contract.drop_off_location_geo && (
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Drop-off Coordinates:</b> <span style={{ color: 'text.primary' }}>
                    {contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}
                  </span>
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, position: 'relative', minHeight: 40 }}>
            {!expanded && (
              <IconButton
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
                sx={{
                  background: 'none',
                  color: 'primary.main',
                  borderRadius: 2,
                  '&:hover': { color: 'primary.dark', background: 'none' }
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            )}
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              Contractor Information
            </Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Contractor Name:</b> <span style={{ color: 'text.primary' }}>
                  {contract.airline ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${contract.airline.last_name || ''}${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}
                </span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Contractor Email:</b> <span style={{ color: 'text.primary' }}>{contract.airline?.email || 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Contractor Contact:</b> <span style={{ color: 'text.primary' }}>{contract.airline?.contact_number || 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Subcontractor Name:</b> <span style={{ color: 'text.primary' }}>
                  {contract.delivery ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${contract.delivery.last_name || ''}${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}
                </span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Subcontractor Email:</b> <span style={{ color: 'text.primary' }}>{contract.delivery?.email || 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Subcontractor Contact:</b> <span style={{ color: 'text.primary' }}>{contract.delivery?.contact_number || 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Status:</b> <span style={{ color: 'primary.main', fontWeight: 700 }}>{contract.contract_status?.status_name || 'N/A'}</span>
              </Typography>
            </Box>

            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              Luggage Information
            </Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              {contract.luggage.length === 0 && (
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>No luggage info.</Typography>
              )}
              {contract.luggage.map((l, lidx) => (
                <Box key={l.id} sx={{ mb: 2, pl: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    Luggage {lidx + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    Case Number: <span style={{ color: 'text.primary' }}>{l.case_number || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    Description: <span style={{ color: 'text.primary' }}>{l.item_description || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    Weight: <span style={{ color: 'text.primary' }}>{l.weight ? `${l.weight} kg` : 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    Contact: <span style={{ color: 'text.primary' }}>{l.contact_number || 'N/A'}</span>
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              Timeline
            </Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Created:</b> <span style={{ color: 'text.primary' }}>{contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Accepted:</b> <span style={{ color: 'text.primary' }}>{contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Delivered:</b> <span style={{ color: 'text.primary' }}>{contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                <b>Cancelled:</b> <span style={{ color: 'text.primary' }}>{contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}</span>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <IconButton
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show less"
                sx={{
                  background: 'none',
                  color: 'primary.main',
                  borderRadius: 2,
                  '&:hover': { color: 'primary.dark', background: 'none' }
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Collapse>
        </Paper>
      )}
    </Box>
  );
}